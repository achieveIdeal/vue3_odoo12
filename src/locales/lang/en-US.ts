
import momentEU from 'moment'
import base from './en-US/base'
import tag from './en-US/tag'

const components = {
  momentName: 'eu',
  momentLocale: momentEU
}
export default {
  message: '-',

  ...components,
  ...base,
  ...tag
}
