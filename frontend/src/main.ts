import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { setupI18n } from './locales';

async function bootstrap() {
  const app = createApp(App);

  const pinia = createPinia();
  app.use(pinia);

  await setupI18n(app);
  app.use(router);

  app.mount('#app');
}

bootstrap();
