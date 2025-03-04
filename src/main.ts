import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader
import router from './router'
import { createApp } from 'vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Components
import App from './App.vue'

import { BindOnceDirective, BindOncePlugin } from 'vue-bind-once'

// import UUID from "uuid";
import { useId } from 'vue'

const vuetify = createVuetify({
  components,
  directives,
  display: {
    mobileBreakpoint: 'sm' // < 600px for v-navigation-drawer
  },
})

const app = createApp(App);

// const app = withUUID(
//   createApp(App)
// );

app.config.errorHandler = (err, vm, info) => {
  console.error("Error:", err);
  console.error("Vue component:", vm);
  console.error("Additional info:", info);
};

app.config.idPrefix = 'app-id';

app
  .use(router)
  .use(vuetify)
  // .use(useId)
  .use(BindOncePlugin)
  .mount('#app')
