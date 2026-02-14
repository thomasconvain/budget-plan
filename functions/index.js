const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors")({origin: true}); // Importa y configura CORS
// Obtén la clave de API desde las configuraciones de Firebase Functions
const apiKey = functions.config().exchangerate.api_key;
const admin = require("firebase-admin");
admin.initializeApp();

const billingModule = require("./billingPeriod");

// Función para obtener la tasa de conversión
exports.getConversionRate = functions.https.onRequest((req, res) => {
  cors(req, res, async () => { // Habilita CORS para esta función
    const fromCurrency = req.query.from;
    const toCurrency = req.query.to;

    try {
      const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`);
      const conversionRate = response.data.conversion_rate;
      res.json({conversionRate});
    } catch (error) {
      console.error("error al obtener la tasa de conversión:", error);
      res.status(500).send("Error al obtener la tasa de conversión");
    }
  });
});

exports.revenuecatWebhook = functions.https.onRequest(async (req, res) => {
  console.log("📩 Webhook recibido:");
  console.log("Body:", JSON.stringify(req.body, null, 2));

  const event = req.body.event;

  if (!event) {
    console.error("❌ No se encontró la propiedad \"event\" en el cuerpo");
    return res.status(400).send("Missing \"event\" key");
  }

  const uid = event.app_user_id || event.original_app_user_id;
  const eventType = event.type;

  if (!uid) {
    console.error("❌ No se encontró app_user_id ni original_app_user_id");
    return res.status(400).send("Missing app_user_id");
  }

  const docRef = admin.firestore().doc(`users/${uid}`);

  try {
    // RevenueCat usa eventos como "INITIAL_PURCHASE",
    //  "CANCELLATION", "EXPIRATION", "RENEWAL"
    const isActive = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"]
        .includes(eventType);

    await docRef.set({
      premium: isActive,
      lastSubscriptionEvent: {
        type: eventType,
        at: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, {merge: true});

    console.log(`✅ Usuario ${uid} actualizado → 
      premium: ${isActive} por ${eventType}`);
    return res.status(200).send("OK");
  } catch (err) {
    console.error("🔥 Error actualizando Firestore:", err);
    return res.status(500).send("Internal error");
  }
});


// Lista de pares que quieras precargar cada día
const currencyPairs = [
  // USD como base
  ["USD", "EUR"],
  ["USD", "CLP"],
  ["USD", "COP"],
  // EUR como base
  ["EUR", "USD"],
  ["EUR", "CLP"],
  ["EUR", "COP"],
  // CLP como base
  ["CLP", "USD"],
  ["CLP", "EUR"],
  ["CLP", "COP"],
  // COP como base
  ["COP", "USD"],
  ["COP", "EUR"],
  ["COP", "CLP"],
];

/**
 * Dado un Date en UTC, ajusta +14 horas y devuelve "YYYY-MM-DD"
 * correspondiente a la zona UTC+14.
 * @param {Date} utcDate - Fecha en UTC.
 * @return {string} Fecha en formato "YYYY-MM-DD" correspondiente a UTC+14.
 */
function getDateStringInUTCPlus14(utcDate) {
  // Sumamos 14 horas al timestamp
  const fechaMas14h = new Date(utcDate.getTime() + 14 * 60 * 60 * 1000);
  const yyyy = fechaMas14h.getUTCFullYear();
  const mm = String(fechaMas14h.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(fechaMas14h.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Construye un Firestore Timestamp que apunte a la medianoche en UTC+14
 * (es decir, 00:00 en UTC+14 equivale a 10:00 UTC del día anterior).
 * Para el documento, no hace falta más granularidad:
 * basta guardar ese instante “10:00 UTC” como Timestamp.
 * @param {number} yyyy - Año en formato numérico (YYYY).
 * @param {number} mm - Mes en formato numérico (1-12).
 * @param {number} dd - Día en formato numérico (1-31).
 * @return {admin.firestore.Timestamp}
 *   Timestamp de Firestore para la medianoche en UTC+14.
 */
function getTimestampForUTCMidnightInUTCPlus14(yyyy, mm, dd) {
  // La medianoche UTC+14 del día YYYY-MM-DD es 00:00 UTC+14
  // => en UTC = YYYY-MM-DD 10:00:00Z
  // (es decir, 10 horas después del día anterior)
  return admin.firestore.Timestamp.fromDate(
      new Date(Date.UTC(yyyy, mm - 1, dd, 10, 0, 0)),
  );
}

/**
 * Llama al mismo endpoint que usa getConversionRate para obtener la tasa.
 * @param {string} fromCurrency - Moneda de origen.
 * @param {string} toCurrency - Moneda de destino.
 */
async function fetchRateAPI(fromCurrency, toCurrency) {
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`;
  const resp = await axios.get(url);
  if (resp.data && typeof resp.data.conversion_rate === "number") {
    return resp.data.conversion_rate;
  }
  throw new Error(
      `Respuesta inesperada de ExchangeRate-API para ${fromCurrency}→` +
      `${toCurrency}`,
  );
}

/**
 * Función programada para que corra todos los días a las 10:00 UTC,
 * que es justo el instante en que en UTC+14 comienzan el nuevo día.
 */
exports.scheduleDailyConversionRates = functions
    .pubsub
    .schedule("0 10 * * *") // 10:00 UTC todos los días
    .timeZone("UTC") // Forzamos a UTC para que no haya ambigüedad
    .onRun(async (context) => {
      const db = admin.firestore();

      // 1) Obtenemos la fecha-hora UTC en el momento de ejecución
      const ahoraUTC = new Date(); // p.ej: "2025-06-05T10:00:00.000Z"

      // 2) Calculamos el "YYYY-MM-DD" que ya es medianoche en UTC+14
      //    Si ahoraUTC = 2025-06-05T10:00:00Z, en UTC+14 ya son
      //    2025-06-06T00:00
      const dateString = getDateStringInUTCPlus14(ahoraUTC);
      // dateString → "2025-06-06"

      // 3) Descomponemos en números para crear el Timestamp
      const [yyyy, mm, dd] = dateString.split("-").map(Number);

      // 4) Construimos el Timestamp que equivale a "medianocho UTC+14"
      //    Eso en UTC es (YYYY-MM-DD 10:00:00Z)
      const timestampMedianochoUTC =
        getTimestampForUTCMidnightInUTCPlus14(yyyy, mm, dd);

      // 5) Iniciamos un batch para agrupar todas las escrituras
      const batch = db.batch();

      for (const [fromCurrency, toCurrency] of currencyPairs) {
        const rateId = `${fromCurrency}_${toCurrency}_${dateString}`;
        const docRef = db.collection("conversion-rates").doc(rateId);

        try {
          const rate = await fetchRateAPI(fromCurrency, toCurrency);
          batch.set(docRef, {
            fromCurrency,
            toCurrency,
            conversionRate: rate,
            // Guardamos el Timestamp que representa “00:00 en UTC+14 del
            // dateString”
            date: timestampMedianochoUTC,
          });
          console.log(
              `✅ Guardada tasa ${fromCurrency}→${toCurrency}: ${rate} ` +
              `(ID: ${rateId})`,
          );
        } catch (err) {
          console.error(
              `❌ Error obteniendo tasa ${fromCurrency}→${toCurrency}:`,
              err.message,
          );
        }
      }

      await batch.commit();
      console.log(
          "📅 scheduleDailyConversionRates: lote completado para",
          dateString,
      );
      return null;
    });

/**
 * Cloud Function programada que corre todos los días a las 10:00 UTC.
 * Busca tarjetas de crédito recurrentes cuyo periodo de facturación haya
 * terminado, las archiva y crea un nuevo periodo con balance en 0.
 */
exports.autoRenewCreditCards = functions
    .pubsub
    .schedule("0 10 * * *") // 10:00 UTC todos los días
    .timeZone("UTC")
    .onRun(async () => {
      const db = admin.firestore();
      const now = new Date();

      // 1) Consultar goals recurrentes no archivados
      const snapshot = await db.collection("goals")
          .where("isRecurring", "==", true)
          .where("isArchived", "==", false)
          .get();

      if (snapshot.empty) {
        console.log("autoRenewCreditCards: No hay tarjetas recurrentes.");
        return null;
      }

      const batch = db.batch();
      let renewedCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Verificar que validUntil ya pasó
        if (!data.validUntil) continue;
        const validUntilDate = data.validUntil.toDate();
        if (now <= validUntilDate) continue;

        // 2) Archivar el goal actual
        batch.update(docSnap.ref, {isArchived: true});

        // 3) Calcular el siguiente periodo
        const nextPeriod = billingModule.calculateNextBillingPeriod(
            data.billingDay,
            validUntilDate,
        );
        const {validFrom, validUntil} = nextPeriod;

        // 4) Balance reseteado a "0" (plain text).
        // El cliente usa tryDecrypt que hace fallback
        // al valor plano si no puede desencriptar.
        const encryptedZeroBalance = "0";

        // 5) Crear nuevo goal para el siguiente periodo
        const newGoalRef = db.collection("goals").doc();
        batch.set(newGoalRef, {
          // Campos encriptados copiados tal cual
          type: data.type,
          title: data.title,
          availableAmount: data.availableAmount,
          mainCurrency: data.mainCurrency,
          // Balance reseteado
          currentBalanceOnAccount: encryptedZeroBalance,
          // Campos planos
          userId: data.userId,
          billingDay: data.billingDay,
          isRecurring: true,
          isArchived: false,
          // Nuevas fechas del periodo
          validFrom: admin.firestore.Timestamp.fromDate(validFrom),
          validUntil: admin.firestore.Timestamp.fromDate(validUntil),
        });

        renewedCount++;
        console.log(
            `✅ Tarjeta ${docSnap.id} archivada → nuevo periodo: ` +
            `${validFrom.toISOString()} - ${validUntil.toISOString()}`,
        );
      }

      if (renewedCount > 0) {
        await batch.commit();
      }

      console.log(
          `📅 autoRenewCreditCards: ${renewedCount} tarjetas renovadas.`,
      );
      return null;
    });

