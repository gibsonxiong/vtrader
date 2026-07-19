import type { App } from 'vue';
import type { Locale } from 'ant-design-vue/es/locale';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import antdEnLocale from 'ant-design-vue/es/locale/en_US';
import antdZhLocale from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';

type SupportedLanguagesType = 'en-US' | 'zh-CN';

const modules = import.meta.glob('./langs/**/*.json', { eager: true });
const messages: Record<string, any> = {};

for (const path in modules) {
  const match = path.match(/\.\/langs\/([^/]+)\/(.*)\.json$/);
  if (match) {
    const [, lang, namespace] = match;
    if (!messages[lang]) messages[lang] = {};
    Object.assign(messages[lang], (modules[path] as any).default);
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages,
  missingWarn: !import.meta.env.PROD,
});

const $t = i18n.global.t;

const antdLocale = ref<Locale>(antdZhLocale);

async function loadAntdLocale(lang: SupportedLanguagesType) {
  switch (lang) {
    case 'en-US':
      antdLocale.value = antdEnLocale;
      break;
    case 'zh-CN':
    default:
      antdLocale.value = antdZhLocale;
      break;
  }
}

async function loadDayjsLocale(lang: SupportedLanguagesType) {
  let locale: any;
  switch (lang) {
    case 'en-US':
      locale = await import('dayjs/locale/en');
      break;
    case 'zh-CN':
    default:
      locale = await import('dayjs/locale/zh-cn');
      break;
  }
  if (locale) dayjs.locale(locale);
}

async function setupI18n(app: App) {
  app.use(i18n);
  const lang = i18n.global.locale.value as SupportedLanguagesType;
  await Promise.all([loadAntdLocale(lang), loadDayjsLocale(lang)]);
}

export { $t, antdLocale, setupI18n };
export type { SupportedLanguagesType };
