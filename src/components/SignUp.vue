<template>
  <div>
    <form @submit.prevent="registerUserDirectly">
      <input
        v-model="email"
        type="email"
        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
        placeholder="Email"
        required />
      <input 
        v-model="password"
        type="password"
        class="mt-4 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
        placeholder="Contraseña"
        required />
      <button
        type="submit"
        class="mt-4 relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-lg group hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
        Registrarse
      </button>
    </form>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import router from '@/router'; 

export default {
  data() {
    return {
      email: '',
      password: '',
      error: '',
    };
  },
  methods: {
    async registerUserDirectly() {
      const auth = getAuth();
      try {
        const result = await createUserWithEmailAndPassword(auth, this.email, this.password);
        console.log('User created successfully:', result.user);
        this.error = '';
        router.push('/dashboard');
      } catch (err) {
        console.error('Error during user registration:', err);
        this.error = 'Error al crear la cuenta: ' + err.message;
      }
    },
  },
};
</script>
