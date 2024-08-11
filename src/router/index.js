import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import GoalDetails from '../views/GoalDetails.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
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

export default router;
