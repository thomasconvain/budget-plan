import { createStore } from 'vuex';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithCredential, GoogleAuthProvider, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';

function userDocPayload(user) {
  const payload = { userId: user.uid };
  if (user.email) payload.email = user.email;
  if (user.displayName) payload.name = user.displayName;
  return payload;
}
import { auth, db } from '@/firebase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@southdevs/capacitor-google-auth';
import router from '@/router'; 

const store = createStore({
  state: {
    user: null,
    loading: true,
    revenueCatReady: false,
    premium: false,
    pendingSharedExpensesCount: 0,
    pendingInvitationsCount: 0,
    unreadNotificationsCount: 0,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    clearUser(state) {
      state.user = null;
    },
    setLoading(state, isLoading) {
      state.loading = isLoading;
    },
    setPremium(state, isPremium) {
      state.premium = isPremium
    },
    setRevenueCatReady(state, value) {
      state.revenueCatReady = value
    },
    setPendingSharedExpensesCount(state, count) {
      state.pendingSharedExpensesCount = count;
    },
    setPendingInvitationsCount(state, count) {
      state.pendingInvitationsCount = count;
    },
    setUnreadNotificationsCount(state, count) {
      state.unreadNotificationsCount = count;
    },
  },
  actions: {
    async register({ commit }, { email, password, name }) {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        commit('setUser', user);

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { userId: user.uid, email, name });
        router.push('/dashboard');
      } catch (error) {
        console.error('Error durante el registro:', error);
        throw error;
      }
    },
    async signIn() {
      try {
        if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios')  {
          console.log('Iniciando sesión con Google en Android...');
          GoogleAuth.initialize({
            clientId: '450979548885-960oesblv9s5chtj7cue78apm8231him.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
          });
          const googleUser = await GoogleAuth.signIn();
          console.log('Usuario de Google:', googleUser);
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          await signInWithCredential(auth, credential);
        } else {
          console.log('Iniciando sesión con Google en la Web...');
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          console.log('Usuario de Google (Web):', result.user);
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
        const payload = userDocPayload(user);
        if (userDoc.exists()) {
          await setDoc(userDocRef, payload, { merge: true });
        } else {
          await setDoc(userDocRef, payload);
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
            const payload = userDocPayload(user);
            await setDoc(userDocRef, payload, { merge: true });
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
    loading: (state) => state.loading,
    totalPendingCount: (state) => state.pendingSharedExpensesCount + state.pendingInvitationsCount,
    unreadNotificationsCount: (state) => state.unreadNotificationsCount,
  },
});

export default store;
