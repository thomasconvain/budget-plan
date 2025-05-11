const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors")({origin: true}); // Importa y configura CORS
// Obtén la clave de API desde las configuraciones de Firebase Functions
const apiKey = functions.config().exchangerate.api_key;
const admin = require("firebase-admin");
admin.initializeApp();

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


