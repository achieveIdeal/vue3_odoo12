import { i18n ,loadLanguageAsync} from '../locales'
import {ref,computed} from 'vue'
import zhCn from '../locales/lang/zh-CN'
import enUs from '../locales/lang/en-US'


// TODO: 后面改为响应式
let messages = {
  'zh-CN': {
    ...zhCn
  },
  'en-US': {
    ...enUs
  }
}
export const defaultLang = ref('zh-CN')
export const tFn = (key: string): string => computed(()=>{
   return messages[defaultLang.value][key];
})

type I18nGlobalTranslation = {
  (key: string): string
  (key: string, locale: string): string
  (key: string, locale: string, list: unknown[]): string
  (key: string, locale: string, named: Record<string, unknown>): string
  (key: string, list: unknown[]): string
  (key: string, named: Record<string, unknown>): string
}

type I18nTranslationRestParameters = [string, any]

function getKey(namespace: string | undefined, key: string) {
  if (!namespace) {
    return key
  }
  if (key.startsWith(namespace)) {
    return key
  }
  return `${namespace}.${key}`
}

export function useI18n(namespace?: string): {
  t: I18nGlobalTranslation
} {
  const normalFn = {
    t: (key: string) => getKey(namespace, key)
  }

  if (!i18n) {
    return normalFn
  }

  const { t, ...methods } = i18n.global

  const tFn: I18nGlobalTranslation = (key: string, ...arg: any[]) => {
    if (!key) return ''
    return t(getKey(namespace, key), ...(arg as I18nTranslationRestParameters))
  }
  return {
    loadLanguageAsync,
    ...methods,
    t: tFn
  }
}

// Why write this function？
// Mainly to configure the vscode i18nn ally plugin. This function is only used for routing and menus. Please use useI18n for other places

// 为什么要编写此函数？
// 主要用于配合vscode i18nn ally插件。此功能仅用于路由和菜单。请在其他地方使用useI18n
export const t = (key: string) => key

// TODO: 后面完善可以自定义插件多语言
export const lang = {
  install(app: { config: { globalProperties: { $t: (key: any) => any } } }, options: { messages: any }) {

    let defaultMessages = {
      ...messages
    }

    if (options && options.messages) {
      defaultMessages = Object.assign(defaultMessages, options.messages)
    }
  }
}

