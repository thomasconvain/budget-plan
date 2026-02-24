import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import { useStore } from 'vuex';

const Dashboard = () => import('@/views/Dashboard.vue');
const CreateGoal = () => import('@/views/CreateGoal.vue');
const GoalDetails = () => import('../views/GoalDetails.vue');
const Contacts = () => import('@/views/Contacts.vue');
const ContactDetail = () => import('@/views/ContactDetail.vue');
const Notifications = () => import('@/views/Notifications.vue');
const PrivacyPolicy = () => import('../views/PrivacyPolicy.vue');

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: PrivacyPolicy,
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
    path: '/create-goal',
    name: 'CreateGoal',
    component: CreateGoal,
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
  {
    path: '/contacts',
    name: 'Contacts',
    component: Contacts,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/contacts/:contactId',
    name: 'ContactDetail',
    component: ContactDetail,
    props: true,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: Notifications,
    meta: {
      requiresAuth: true
    }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
