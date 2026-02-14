// functions/encryption.js
// Versión Node.js del módulo de encriptación del cliente.
// Usa Buffer en lugar de btoa/atob.

const {hkdf} = require("@noble/hashes/hkdf");
const {sha256} = require("@noble/hashes/sha256");
const {xchacha20poly1305} = require("@noble/ciphers/chacha");
const {managedNonce} = require("@noble/ciphers/webcrypto");
const {utf8ToBytes} = require("@noble/ciphers/utils");

// 1) Derivar clave de 32 bytes desde el UID del usuario
const deriveKey = (uid) => {
  const salt = new TextEncoder().encode("firebase-user-encryption");
  const ikm = new TextEncoder().encode(uid);
  return hkdf(sha256, ikm, salt, new Uint8Array(), 32);
};

// 2) Crear instancias gestionadas que autoprependen nonce
const getCipher = (key) => managedNonce(xchacha20poly1305)(key);

// 3) Cifrar un string UTF-8 y devolverlo en base64
const encrypt = (plaintext, key) => {
  const cipher = getCipher(key);
  const data = utf8ToBytes(plaintext);
  const ct = cipher.encrypt(data);
  return Buffer.from(ct).toString("base64");
};

// 4) Descifrar base64 de vuelta a string UTF-8
const decrypt = (ciphertextB64, key) => {
  const cipher = getCipher(key);
  const ct = Buffer.from(ciphertextB64, "base64");
  const pt = cipher.decrypt(new Uint8Array(ct));
  if (!pt) throw new Error("Falló el descifrado");
  return new TextDecoder().decode(pt);
};

module.exports = {deriveKey, encrypt, decrypt};
