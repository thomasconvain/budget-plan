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

router.beforeEach(async (to, from, next) => {
  const store = useStore();
  // Agregamos logs para ver cómo se comporta
  console.log('Guard de ruta ejecutado');

  if (store.state.loading) {
    console.log('Esperando a que el usuario se cargue...');
    await store.dispatch('loadUser');
  }

  const user = store.getters.user;
  console.log('Estado del usuario:', user);

  if (user && to.path === '/') {
    console.log('Usuario autenticado, redirigiendo a dashboard');
    next('/dashboard');
  } else if (!user && to.meta.requiresAuth) {
    console.log('Usuario no autenticado, redirigiendo a home');
    next('/');
  } else {
    console.log('Navegación permitida');
    next();
  }
});

export default router;
