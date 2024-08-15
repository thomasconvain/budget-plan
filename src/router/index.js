import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import { useStore } from 'vuex';
import GoalDetails from '../views/GoalDetails.vue';
import Dashboard from '@/views/Dashboard.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/goal/:goalId',
    name: 'GoalDetails',
    component: GoalDetails,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Helper para esperar a que el estado del usuario esté disponible
function getUserState(store) {
  return new Promise((resolve) => {
    const unsubscribe = store.watch(
      (state, getters) => getters.user,
      (user) => {
        if (user !== null) {
          resolve(user);
          unsubscribe();
        }
      }
    );
    // También verifica el estado actual
    if (store.getters.user !== null) {
      resolve(store.getters.user);
      unsubscribe();
    }
  });
}

router.beforeEach(async (to, from, next) => {
  const store = useStore();

  const user = await getUserState(store);

  if (user && to.path === '/') {
    // Si el usuario está autenticado y trata de acceder a la ruta '/', redirige a '/dashboard'
    next('/dashboard');
  } else {
    // Si no, permite la navegación normal
    next();
  }
});

export default router;
