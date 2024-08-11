import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/tailwind.css'
import store from './store';
import { auth } from './firebase'; // Importa Firebase config
import { onAuthStateChanged } from 'firebase/auth';

const app = createApp(App);

// Observador para detectar cambios de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    store.commit('setUser', user); // Solo si usas Vuex
  } else {
    store.commit('clearUser'); // Solo si usas Vuex
  }
});

// Monta la aplicación
app.use(store); // Solo si estás usando Vuex
// Cargar el usuario y la dirección al iniciar la aplicación
store.dispatch('loadUser');
app.mount('#app');
