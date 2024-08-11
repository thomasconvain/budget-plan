import { createStore } from 'vuex';
import { auth, db } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';

const store = createStore({
  state: {
    user: null,
    address: null,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    clearUser(state) {
      state.user = null;
      state.address = null;
    },
    setAddress(state, address) {
      state.address = address;
    },
  },
  actions: {
    async signIn({ commit }) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        commit('setUser', user);

        // Recuperar la dirección del usuario desde Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          commit('setAddress', userDoc.data().address);
        } else {
          // Si no existe, crea el documento con un campo de dirección vacío
          await setDoc(userDocRef, { userId: user.uid, address: '' });
          commit('setAddress', ''); // Inicialmente vacío
        }
      } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
      }
    },
    async logout({ commit }) {
      try {
        await signOut(auth);
        commit('clearUser');
      } catch (error) {
        console.error('Error durante el cierre de sesión:', error);
      }
    },
    async saveAddress({ state, commit }, address) {
      try {
        const userDocRef = doc(db, 'users', state.user.uid);
        await setDoc(userDocRef, { address }, { merge: true });
        commit('setAddress', address);
      } catch (error) {
        console.error('Error al guardar la dirección:', error);
      }
    },
    async savePayment({ state }, paymentData) {
      try {
        await addDoc(collection(db, 'payments'), {
          userId: state.user.uid,
          amount: paymentData.amount,
          category: paymentData.category,
        });
        console.log('Pago guardado exitosamente');
      } catch (error) {
        console.error('Error al guardar el pago:', error);
      }
    },
    async loadUser({ commit }) {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          commit('setUser', user);

          // Cargar la dirección desde Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            commit('setAddress', userDoc.data().address);
          } else {
            // Si no existe, crea el documento con un campo de dirección vacío
            await setDoc(userDocRef, { userId: user.uid, address: '' });
            commit('setAddress', ''); // Inicialmente vacío
          }
        }
      });
    },
  },
  getters: {
    user: (state) => state.user,
    address: (state) => state.address,
  },
});

export default store;
