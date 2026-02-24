/**
 * Parser de notificaciones bancarias chilenas.
 * Extrae monto, comercio y moneda del texto de la notificación.
 */

// Configuración de bancos soportados
export const SUPPORTED_BANKS = [
  {
    id: 'bci',
    name: 'BCI',
    packageName: 'cl.bci.pass',
    icon: 'CreditCardIcon',
  },
  {
    id: 'santander',
    name: 'Santander',
    packageName: 'cl.santander.smartphone',
    icon: 'CreditCardIcon',
  },
  {
    id: 'bancoestado',
    name: 'Banco Estado',
    packageName: 'cl.bancoestado.bancoestado',
    icon: 'CreditCardIcon',
  },
];

// Notificaciones que deben ignorarse (no son compras)
const IGNORE_PATTERNS = [
  /cashback/i,
  /[Rr]ecibiste una transferencia/,
  /[Tt]ransferencia recibida/,
  /[Cc]lave dinámica/,
  /[Ii]ngresa a la [Aa]pp/,
];

/**
 * Formato real BCI (confirmado con screenshots):
 *
 * Nacional:
 *   "El 23/02/2026 a las 20:30 hrs. se realizo compra 0 en EXPRESS TOBALABA
 *    por $42.533 con su Tarjeta de Credito terminada en 6524."
 *
 * Internacional:
 *   "El 23/02/2026 a las 13:06 hrs. se realizo COMPRA INTERNACIONAL en ANTHROPIC
 *    por USD 5,95 con su Tarjeta de Credito terminada en 6524."
 */
const BANK_PATTERNS = {
  'cl.bci.pass': [
    // Compra internacional: "se realizo COMPRA INTERNACIONAL en ANTHROPIC por USD 5,95 con su Tarjeta"
    {
      regex: /se realizo COMPRA INTERNACIONAL en (.+?) por (USD|EUR)\s+([\d.,]+) con su/i,
      parse: (match) => ({
        merchant: cleanMerchant(match[1]),
        currency: match[2].toUpperCase(),
        amount: parseAmount(match[3]),
      }),
    },
    // Compra nacional: "se realizo compra 0 en EXPRESS TOBALABA por $42.533 con su Tarjeta"
    {
      regex: /se realizo compra \d+ en (.+?) por \$([\d.,]+) con su/i,
      parse: (match) => ({
        merchant: cleanMerchant(match[1]),
        currency: 'CLP',
        amount: parseAmount(match[2]),
      }),
    },
  ],
  'cl.santander.smartphone': [
    // Internacional (formato estimado, ajustar con notificación real)
    {
      regex: /COMPRA INTERNACIONAL en (.+?) por (USD|EUR)\s+([\d.,]+)/i,
      parse: (match) => ({
        merchant: cleanMerchant(match[1]),
        currency: match[2].toUpperCase(),
        amount: parseAmount(match[3]),
      }),
    },
    // Nacional (formato estimado, ajustar con notificación real)
    {
      regex: /compra.*?en (.+?) por \$([\d.,]+)/i,
      parse: (match) => ({
        merchant: cleanMerchant(match[1]),
        currency: 'CLP',
        amount: parseAmount(match[2]),
      }),
    },
  ],
  'cl.bancoestado.bancoestado': [
    // Internacional (formato estimado, ajustar con notificación real)
    {
      regex: /COMPRA INTERNACIONAL en (.+?) por (USD|EUR)\s+([\d.,]+)/i,
      parse: (match) => ({
        merchant: cleanMerchant(match[1]),
        currency: match[2].toUpperCase(),
        amount: parseAmount(match[3]),
      }),
    },
    // Nacional (formato estimado, ajustar con notificación real)
    {
      regex: /compra.*?en (.+?) por \$([\d.,]+)/i,
      parse: (match) => ({
        merchant: cleanMerchant(match[1]),
        currency: 'CLP',
        amount: parseAmount(match[2]),
      }),
    },
  ],
};

// Pattern genérico como fallback
const GENERIC_PATTERNS = [
  {
    regex: /COMPRA INTERNACIONAL en (.+?) por (USD|EUR)\s+([\d.,]+)/i,
    parse: (match) => ({
      merchant: cleanMerchant(match[1]),
      currency: match[2].toUpperCase(),
      amount: parseAmount(match[3]),
    }),
  },
  {
    regex: /compra.*?en (.+?) por \$([\d.,]+)/i,
    parse: (match) => ({
      merchant: cleanMerchant(match[1]),
      currency: 'CLP',
      amount: parseAmount(match[2]),
    }),
  },
];

/**
 * Parsea el texto de una notificación bancaria.
 * @param {string} text - Texto de la notificación
 * @param {string} packageName - Package name de la app bancaria
 * @returns {{ amount: number, merchant: string, currency: string } | null}
 */
export function parseNotification(text, packageName) {
  if (!text) return null;

  // Ignorar notificaciones que no son compras
  for (const ignorePattern of IGNORE_PATTERNS) {
    if (ignorePattern.test(text)) return null;
  }

  const patterns = BANK_PATTERNS[packageName] || GENERIC_PATTERNS;

  for (const { regex, parse } of patterns) {
    const match = text.match(regex);
    if (!match) continue;

    const result = parse(match);
    if (result && result.amount > 0) {
      return result;
    }
  }

  return null;
}

/**
 * Convierte string de monto a número.
 * Maneja formatos: "42.533", "5,95", "1.234.567"
 */
function parseAmount(amountStr) {
  if (!amountStr) return 0;

  let cleaned = amountStr.trim();

  // Formato chileno: puntos como separador de miles (42.533 = 42533)
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '');
    return parseInt(cleaned, 10);
  }

  // Formato con coma como decimal: "5,95"
  if (/^\d+,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(',', '.');
    return parseFloat(cleaned);
  }

  // Formato decimal estándar: "12.50"
  if (/^\d+\.\d{1,2}$/.test(cleaned)) {
    return parseFloat(cleaned);
  }

  // Número sin separadores
  cleaned = cleaned.replace(/[.,]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Limpia el nombre del comercio.
 */
function cleanMerchant(merchant) {
  if (!merchant) return 'Compra';
  return merchant
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')
    .replace(/\s*\d+\s*$/, '') // Quitar números sueltos al final (como "compra 0")
    .substring(0, 100);
}

/**
 * Busca el banco por package name.
 */
export function getBankByPackage(packageName) {
  return SUPPORTED_BANKS.find(b => b.packageName === packageName) || null;
}

/**
 * Retorna los package names de todos los bancos soportados.
 */
export function getAllBankPackageNames() {
  return SUPPORTED_BANKS.map(b => b.packageName);
}
