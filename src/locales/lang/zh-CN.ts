
import momentCN from 'moment'
import base from './zh-CN/base'
import tag from './zh-CN/tag'

const components = {
  momentName: 'zh-cn',
  momentLocale: momentCN
}

export default {
  message: '-',

  ...components,
  ...base,
  ...tag
}
