// src/services/userService.js

import { getAuth } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const auth = getAuth()
const db = getFirestore()

/**
 * Devuelve los datos del documento de Firestore
 * correspondiente al usuario autenticado en Firebase Auth.
 *
 * @returns {Promise<Object>} Objeto con los datos del usuario
 * @throws {Error} Si no hay usuario logueado o no existe el documento
 */
export async function fetchUser() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No hay ningún usuario autenticado.')
  }

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error(`No se encontró documento en 'users' con ID ${user.uid}.`)
  }

  return userSnap.data()
}
