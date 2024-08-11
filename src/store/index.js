// src/store/index.js
import { createStore } from 'vuex';
import { auth } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export default createStore({
  state: {
    user: null,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    clearUser(state) {
      state.user = null;
    },
  },
  actions: {
    async signIn({ commit }) {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      commit('setUser', result.user);
    },
    async logout({ commit }) {
      await signOut(auth);
      commit('clearUser');
    },
  },
  getters: {
    user: (state) => state.user,
  },
});

