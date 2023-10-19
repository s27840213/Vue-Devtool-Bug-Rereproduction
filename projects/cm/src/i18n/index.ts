import jp from '@i18n/jp.json'
import tw from '@i18n/tw.json'
import us from '@i18n/us.json'
import i18n, { LocaleName as _LocaleName } from '@nu/vivi-lib/i18n'

i18n.global.setLocaleMessage('us', us)
i18n.global.setLocaleMessage('tw', tw)
i18n.global.setLocaleMessage('jp', jp)

export type LocaleName = _LocaleName
export default i18n
