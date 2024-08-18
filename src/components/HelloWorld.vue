<template>
  <div>
    <div class="flex items-center justify-center my-24">
    <div class="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-xl">
      <div class="flex justify-center">
        <!-- <svg class="w-10 h-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1zm0 4c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1z"/>
        </svg> -->
      </div>
      <h2 v-if="!isSignup" class="text-2xl font-bold text-center text-gray-900">Hola 👋</h2>
      <h2 v-else class="text-2xl font-bold text-center text-gray-900">Crea una cuenta</h2>
      <form v-if="!isSignup" class="mt-8 space-y-6" @submit.prevent="loginWithEmail">
        <div class="rounded-xl shadow-sm">
          <div>
            <label for="email-address" class="sr-only">Email</label>
            <input v-model="email" id="email-address" name="email" type="email" autocomplete="email" required
                   class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                   placeholder="Email">
          </div>
          <div class="mt-4">
            <label for="password" class="sr-only">Clave</label>
            <input v-model="password" id="password" name="password" type="password" autocomplete="current-password" required
                   class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                   placeholder="Password">
            <p v-if="error">{{ error }}</p>
          </div>
        </div>

        <div>
          <button type="submit"
                  class="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Entrar
          </button>
          <button
            @click="isSignup = true"
            class="relative flex justify-center w-full mt-1 px-4 py-2 text-sm font-medium text-indigo-600 bg-transparent rounded-lg group hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            ¿No tienes una cuenta?
          </button>
        </div>

        <div class="relative mt-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 text-gray-500 bg-white">O</span>
          </div>
        </div>
      </form>
      <div class="flex justify-center">
          <div>
            <button @click="signIn" class="gsi-material-button" style="width:300px">
              <div class="gsi-material-button-state"></div>
              <div class="gsi-material-button-content-wrapper">
                <div class="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span class="gsi-material-button-contents">Continuar con Google</span>
                <span style="display: none;">Continuar con Google</span>
              </div>
            </button>
          </div>
        </div>
        <div v-if="isSignup">
          <SignUp />
          <button @click="isSignup = false"
                    class="relative flex justify-center w-full mt-1 px-4 py-2 text-sm font-medium text-indigo-600 bg-transparent rounded-lg group hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Volver
            </button>
        </div>
    </div>
  </div>






    <p v-if="user">Bienvenido {{ user.displayName }}</p>
    <!-- <button v-if="!user" @click="signIn">Iniciar sesión con Google</button> -->
    <button v-if="user" @click="logout">Cerrar sesión</button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import SignUp from './SignUp.vue'

export default {
  components: {
    SignUp
  },
  data() {
    return {
      email: '',
      password: '',
      error: '',
      isSignup: false,
    };
  },
  computed: {
    ...mapGetters(['user']),
  },
  methods: {
    ...mapActions(['signIn', 'logout', 'signInWithEmail']),
    async loginWithEmail() {
      this.error = '';
      try {
        await this.signInWithEmail({ email: this.email, password: this.password });
        // Redirigir a otra página si el inicio de sesión es exitoso
        // this.$router.push('/dashboard');
      } catch (err) {
        if (err.code === 'auth/invalid-credential') {
          this.error = 'La contraseña es incorrecta.';
        } else if (err.code === 'auth/user-not-found') {
          this.error = 'No se encontró ninguna cuenta con este correo electrónico.';
        } else {
          this.error = 'Error al iniciar sesión: ' + err.message;
        }
      }
    },
  },
};
</script>

<style>
.gsi-material-button {
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  -webkit-appearance: none;
  background-color: WHITE;
  background-image: none;
  border: 1px solid #747775;
  -webkit-border-radius: 20px;
  border-radius: 20px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #1f1f1f;
  cursor: pointer;
  font-family: 'Roboto', arial, sans-serif;
  font-size: 14px;
  height: 40px;
  letter-spacing: 0.25px;
  outline: none;
  overflow: hidden;
  padding: 0 12px;
  position: relative;
  text-align: center;
  -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
  transition: background-color .218s, border-color .218s, box-shadow .218s;
  vertical-align: middle;
  white-space: nowrap;
  width: auto;
  max-width: 400px;
  min-width: min-content;
}

.gsi-material-button .gsi-material-button-icon {
  height: 20px;
  margin-right: 12px;
  min-width: 20px;
  width: 20px;
}

.gsi-material-button .gsi-material-button-content-wrapper {
  -webkit-align-items: center;
  align-items: center;
  display: flex;
  -webkit-flex-direction: row;
  flex-direction: row;
  -webkit-flex-wrap: nowrap;
  flex-wrap: nowrap;
  height: 100%;
  justify-content: center;
  position: relative;
  width: 100%;
}

.gsi-material-button .gsi-material-button-contents {
  -webkit-flex-grow: 0;
  flex-grow: 0;
  font-family: 'Roboto', arial, sans-serif;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}

.gsi-material-button .gsi-material-button-state {
  -webkit-transition: opacity .218s;
  transition: opacity .218s;
  bottom: 0;
  left: 0;
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.gsi-material-button:disabled {
  cursor: default;
  background-color: #ffffff61;
  border-color: #1f1f1f1f;
}

.gsi-material-button:disabled .gsi-material-button-contents {
  opacity: 38%;
}

.gsi-material-button:disabled .gsi-material-button-icon {
  opacity: 38%;
}

.gsi-material-button:not(:disabled):active .gsi-material-button-state, 
.gsi-material-button:not(:disabled):focus .gsi-material-button-state {
  background-color: #303030;
  opacity: 12%;
}

.gsi-material-button:not(:disabled):hover .gsi-material-button-state {
  background-color: #848484;
  opacity: 8%;
}
</style>
