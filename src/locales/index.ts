import type { App } from 'vue'
import type { I18n, I18nOptions } from 'vue-i18n'
import { createI18n } from 'vue-i18n'
// default lang
import zhCn from './lang/zh-CN'
import enUs from './lang/en-US'

export const defaultLang = 'zh-CN'
export let i18n: any;
export const messages = {
  'zh-CN': {
    ...zhCn
  },
  'en-US': {
    ...enUs
  }
}



function setI18nLanguage(lang: string) {
  i18n.locale = lang
  // @ts-ignore
  document.querySelector('html').setAttribute('lang', lang)
  return lang
}



export function loadLanguageAsync(lang = defaultLang) {
  return new Promise(resolve => {
    if (i18n.locale !== lang) {
      return resolve(setI18nLanguage(lang))
    }
    return resolve(lang)
  })
}


// setup i18n instance with glob
export function setupI18n(app: App<Element>) {
  const options = {
    silentTranslationWarn: true,
    locale: defaultLang,
    fallbackLocale: 'zh-CN',
    messages
  }
  i18n = createI18n(options) as I18n
  app.use(i18n);
}

 
