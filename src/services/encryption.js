// src/services/encryption.js
import { hkdf }                          from '@noble/hashes/hkdf';
import { sha256 }                        from '@noble/hashes/sha256';
import { xchacha20poly1305 }             from '@noble/ciphers/chacha';
import { managedNonce }                  from '@noble/ciphers/webcrypto';
import { utf8ToBytes }                   from '@noble/ciphers/utils';

// 1) Derivar clave de 32 bytes desde el UID del usuario
export const deriveKey = (uid) => {
  const salt = new TextEncoder().encode('firebase-user-encryption');
  const ikm  = new TextEncoder().encode(uid);
  return hkdf(sha256, ikm, salt, new Uint8Array(), 32);
};

// 2) Crear instancias gestionadas que autoprependen nonce
const getCipher = (key) => managedNonce(xchacha20poly1305)(key);

// 3) Cifrar un string UTF-8 y devolverlo en base64
export const encrypt = (plaintext, key) => {
  const cipher = getCipher(key);
  const data   = utf8ToBytes(plaintext);
  const ct     = cipher.encrypt(data);
  return btoa(String.fromCharCode(...ct));
};

// 4) Descifrar base64 de vuelta a string UTF-8
export const decrypt = (ciphertextB64, key) => {
  const cipher = getCipher(key);
  const ct      = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const pt      = cipher.decrypt(ct);
  if (!pt) throw new Error('Falló el descifrado');
  return new TextDecoder().decode(pt);
};
