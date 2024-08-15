import { createStore } from 'vuex';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import router from '@/router'; 

const store = createStore({
  state: {
    user: null,
    address: null,
    loading: true,
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
    setLoading(state, isLoading) {
      state.loading = isLoading;
    }
  },
  actions: {
    async register({ commit }, { email, password, name }) {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        commit('setUser', user);

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { userId: user.uid, email, name, address: '' });

        commit('setAddress', ''); 
        return true;
      } catch (error) {
        console.error('Error durante el registro:', error);
        throw error;
      }
    },
    async signIn({ commit }) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        commit('setUser', user);

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          commit('setAddress', userDoc.data().address);
        } else {
          await setDoc(userDocRef, { userId: user.uid, address: '' });
          commit('setAddress', '');
        }
        router.push('/dashboard');
      } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
      }
    },
    async signInWithEmail({ commit }, { email, password }) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;
        commit('setUser', user);
  
        // Recuperar la dirección del usuario desde Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
  
        if (userDoc.exists()) {
          commit('setAddress', userDoc.data().address);
        } else {
          await setDoc(userDocRef, { userId: user.uid, address: '' });
          commit('setAddress', '');
        }
        router.push('/dashboard');
      } catch (error) {
        console.error('Error durante el inicio de sesión con correo electrónico:', error);
        throw error; // Propagar el error para que el componente lo maneje
      }
    },
    async logout({ commit }) {
      try {
        await signOut(auth);
        commit('clearUser');
        router.push('/')
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
      commit('setLoading', true); // Inicia el proceso de carga
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            commit('setUser', user);

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              commit('setAddress', userDoc.data().address);
            } else {
              await setDoc(userDocRef, { userId: user.uid, address: '' });
              commit('setAddress', '');
            }
          } else {
            commit('clearUser');
          }
          commit('setLoading', false); // Finaliza el proceso de carga
          resolve();
        });
      });
    },
  },
  getters: {
    user: (state) => state.user,
    address: (state) => state.address,
    loading: (state) => state.loading,
  },
});

export default store;
