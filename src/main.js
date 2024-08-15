import { createApp } from 'vue';
import App from './App.vue';
import './assets/css/tailwind.css';
import store from './store';
import router from './router'; // Importa el router que configuraste
import { auth } from './firebase'; // Importa Firebase config
import { onAuthStateChanged } from 'firebase/auth';

const app = createApp(App);

// Cargar el usuario y la dirección al iniciar la aplicación
store.dispatch('loadUser');

// Observador para detectar cambios de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    store.commit('setUser', user); // Solo si usas Vuex
  } else {
    store.commit('clearUser'); // Solo si usas Vuex
  }
});

// Usa Vuex
app.use(store); 

// Usa Vue Router
app.use(router); 

// Monta la aplicación
app.mount('#app');
