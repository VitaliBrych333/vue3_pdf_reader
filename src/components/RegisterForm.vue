<script lang="ts">
import { useRoute } from 'vue-router'
import MessageWindow from './shared/MessageWindow.vue'
import { storeUser } from '../store/storeUser'
import { useRequestInit } from '../composables/useRequestInit'

export default {
  components: {
    MessageWindow,
  },

  data() {
    return {
      storeUser,
      validForm: false,
      firstName: '',
      nameRules: [
        (value: string) => {
          if (value) return true

          return 'Name is required.'
        },
        (value: string) => {
          if (/[^0-9]/.test(value)) return true

          return 'Name can not contain digits.'
        },
        (value: string) => {
          if (value?.length <= 10) return true

          return 'Name must be less than 10 characters.'
        },
      ],
      lastName: '',
      email: '',
      emailRules: [
        (value: string) => {
          if (value) return true

          return 'E-mail is required.'
        },
        (value: string) => {
          if (/.+@.+\..+/.test(value)) return true

          return 'E-mail must be valid.'
        },
      ],
      password: '',
      passwordRules: [
        (value: string) => {
          if (value) return true

          return 'Password is required.'
        },
        // (value: string) => {
        //   if (/.+@.+\..+/.test(value)) return true

        //   return 'E-mail must be valid.'
        // },
      ],
      visible: false,
      location: useRoute(),
      messageTitle: '',
      messageText: '',
      isVisibleMessage: false,
    }
  },

  methods: {
    async submit() {
      if (this.validForm) {
        try {
          if (this.location.path === '/login') {
            this.login()
          }

          if (this.location.path === '/register') {
            this.register()
          }
        } catch (error) {
          console.error('Error fetching data:', error)
          throw error // Rethrow the error to propagate it further
        }
      }
    },

    async login() {
      const { email, password } = this
      const options = useRequestInit('POST', { email, password }, true)
      const response = await fetch('http://localhost:8081/login', options)

      // нужно вернуть user_Id, чтобы добавлять для документов

      if (response.ok) {
        const data = await response.json()

        if (data.userId && data.status === 'Success') {
          storeUser.setUserId(data.userId)
          this.$router.push({ name: 'docReader' })
        } else {
          this.showMessage('Failed', 'Invalid email or password! Please try again.', true)
        }
      } else {
        this.showMessage('Failed', 'Invalid email or password! Please try again.', true)
      }
    },

    async register() {
      const { firstName, lastName, email, password } = this
      const options = useRequestInit('POST', { firstName, lastName, email, password }, true)
      const response = await fetch('http://localhost:8081/register', options)

      if (response.ok) {
        const data = await response.json()

        if (data?.id) {
          this.showMessage('Succes', 'Register succes! Please Log in now.', true)
        } else {
          this.showMessage('Failed', 'Something wrong! Please try again.', true)
        }
      } else {
        this.showMessage('Failed', 'Something wrong! Please try again.', true)
      }
    },

    async getUsers() {
      const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // "include" | "omit" | "same-origin" - to send in request a cookie with token
      }

      const response = await fetch('http://localhost:8081/users', requestOptions as RequestInit)

      const data = await response.json()

      console.log('data-----------users', data)
    },

    showMessage(title: string, text: string, show: boolean) {
      this.messageTitle = title
      this.messageText = text
      this.isVisibleMessage = show
    },

    closeMessage() {
      this.isVisibleMessage = false
      this.$router.push({ name: 'login' })
    },

    getLink() {
      return this.$router.currentRoute.value.path === '/login' ? '/register' : '/login'
    },
  },
}
</script>

<template>
  <MessageWindow
    :showMessage="isVisibleMessage"
    :title="messageTitle"
    :text="messageText"
    @clickOk="closeMessage"
  />

  <v-form class="form" v-model="validForm" @submit.prevent="submit">
    <v-img
      class="mx-auto my-6"
      max-width="228"
      src="https://cdn.vuetifyjs.com/docs/images/logos/vuetify-logo-v3-slim-text-light.svg"
    ></v-img>

    <v-card class="mx-auto pa-12 pb-8" elevation="8" max-width="448" rounded="lg">
      <template v-if="location.path === '/register'">
        <div class="text-subtitle-1 text-medium-emphasis">First name</div>
        <v-text-field
          v-model="firstName"
          :rules="nameRules"
          density="compact"
          placeholder="First name"
          prepend-inner-icon="mdi-account-badge-outline"
          variant="outlined"
        ></v-text-field>

        <div class="text-subtitle-1 text-medium-emphasis">Last name</div>
        <v-text-field
          v-model="lastName"
          :rules="nameRules"
          density="compact"
          placeholder="Last name"
          prepend-inner-icon="mdi-account-badge-outline"
          variant="outlined"
        ></v-text-field>
      </template>

      <div class="text-subtitle-1 text-medium-emphasis">Account</div>
      <v-text-field
        v-model="email"
        :rules="emailRules"
        density="compact"
        placeholder="Email address"
        prepend-inner-icon="mdi-email-outline"
        variant="outlined"
      ></v-text-field>

      <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
        Password
      </div>
      <v-text-field
        v-model="password"
        :rules="passwordRules"
        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible ? 'text' : 'password'"
        density="compact"
        placeholder="Enter your password"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        @click:append-inner="visible = !visible"
      ></v-text-field>

      <v-btn class="mb-8" color="blue" size="large" variant="tonal" block type="submit">
        {{ location.path === '/login' ? 'Log In' : 'Register' }}
      </v-btn>

      <v-btn class="mb-8" color="blue" size="large" variant="tonal" block @click="getUsers">
        Get users
      </v-btn>

      <v-card-text class="text-center">
        <v-card-text class="text-medium-emphasis text-caption">
          {{ location.path === '/login' ? 'Do not have' : 'Already have' }} account, click
        </v-card-text>
        <RouterLink class="text-blue text-decoration-none" :to="getLink()">{{
          location.path === '/login' ? 'Register' : 'Log In'
        }}</RouterLink>
      </v-card-text>
    </v-card>
  </v-form>
</template>

<style scoped>
.form {
  width: 400px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
