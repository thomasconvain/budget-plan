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
    meta: {
      requiresAuth: true // Esta ruta requiere autenticación
    }
  },
  {
    path: '/goal/:goalId',
    name: 'GoalDetails',
    component: GoalDetails,
    props: true,
    meta: {
      requiresAuth: true // Esta ruta requiere autenticación
    }
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const store = useStore();

  if (store.state.loading) {
    await store.dispatch('loadUser');
  }

  const user = store.getters.user;

  if (user && to.path === '/') {
    next('/dashboard');
  } else if (!user && to.meta.requiresAuth) {
    next('/');
  } else {
    next();
  }
});

export default router;
