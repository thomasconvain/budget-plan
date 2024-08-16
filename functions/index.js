const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors")({origin: true}); // Importa y configura CORS

// Obtén la clave de API desde las configuraciones de Firebase Functions
const apiKey = functions.config().exchangerate.api_key;

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
