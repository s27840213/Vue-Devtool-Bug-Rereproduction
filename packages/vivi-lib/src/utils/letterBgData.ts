import i18n from '@/i18n'
import { ITextLetterBg } from '@/interfaces/format'
import store from '@/store'
import constantData from '@/utils/constantData'
import textUtils from '@/utils/textUtils'

export const textLetterBgName = [
  'rainbow', 'rainbow-dark', 'circle', 'cloud', 'text-book', 'penguin',
  'planet', 'heart', 'heart-warm', 'heart-custom', 'gummybear', 'leaf',
  'butter-flower', 'flower-frame', 'flower-frame-custom', 'vintage-flower',
  'vintage-flower-custom', 'cat-paw', 'bread', 'bear', 'bear-custom',
  'cat', 'cat-custom', 'rabbit', 'rabbit-custom', 'dog', 'dog-custom',
  'star', 'baby', 'paper-tap', 'paper-tap-point', 'paper-tap-stripe',
  'paper-tap-grid', 'triangle-flag', 'triangle-flag-custom',
  'rectangle-flag', 'rectangle-flag-custom', 'stretch-dog', 'stretch-rabbit',
  'stretch-cat', 'stretch-dragon',
] as const

export type ITextLetterBgName = typeof textLetterBgName[number]

class LetterBGData {
  getEffects() {
    const noColor = constantData.toOptions([
      'xOffset200',
      'yOffset200',
      'size',
      'opacity',
      'fontSpacing',
      'lineHeight'
    ])
    const withColor = constantData.toOptions([
      'xOffset200',
      'yOffset200',
      'size',
      'opacity',
      'fontSpacing',
      'lineHeight',
      'color'
    ])

    return [{
      key: 'rainbow',
      label: i18n.global.tc('NN0816'),
      plan: 1,
      options: noColor,
    }, {
      key: 'rainbow-dark',
      label: i18n.global.tc('NN0817'),
      plan: 1,
      options: noColor,
    }, {
      key: 'circle',
      label: i18n.global.tc('NN0820'),
      plan: 1,
      options: withColor,
    }, {
      key: 'heart',
      label: i18n.global.tc('NN0847'),
      plan: 1,
      options: noColor,
    }, {
      key: 'heart-warm',
      label: i18n.global.tc('NN0848'),
      plan: 1,
      options: noColor,
    }, {
      key: 'heart-custom',
      label: i18n.global.tc('NN0849'),
      plan: 1,
      options: withColor,
    }, {
      key: 'cloud',
      label: i18n.global.tc('NN0818'),
      plan: 1,
      options: withColor,
    }, {
      key: 'text-book',
      label: i18n.global.tc('NN0819'),
      plan: 1,
      options: withColor,
    }, {
      key: 'penguin',
      label: i18n.global.tc('NN0821'),
      options: noColor,
    }, {
      key: 'planet',
      label: i18n.global.tc('NN0822'),
      options: noColor,
    }, {
      key: 'leaf',
      label: i18n.global.tc('NN0851'),
      plan: 1,
      options: noColor,
    }, {
      key: 'gummybear',
      label: i18n.global.tc('NN0850'),
      plan: 1,
      options: noColor,
    }, {
      key: 'butter-flower',
      label: i18n.global.tc('NN0852'),
      plan: 1,
      options: withColor,
    }, {
      key: 'flower-frame',
      label: i18n.global.tc('NN0853'),
      plan: 1,
      options: noColor,
    }, {
      key: 'flower-frame-custom',
      label: i18n.global.tc('NN0854'),
      options: withColor,
    }, {
      key: 'vintage-flower',
      label: i18n.global.tc('NN0855'),
      options: noColor,
    }, {
      key: 'vintage-flower-custom',
      label: i18n.global.tc('NN0856'),
      plan: 1,
      options: withColor,
    }, {
      key: 'cat-paw',
      label: i18n.global.tc('NN0864'),
      plan: 1,
      options: noColor,
    }, {
      key: 'bread',
      label: i18n.global.tc('NN0865'),
      plan: 1,
      options: noColor,
    }, {
      key: 'bear',
      label: i18n.global.tc('NN0874'),
      plan: 1,
      options: noColor,
    }, {
      key: 'bear-custom',
      label: i18n.global.tc('NN0875'),
      plan: 1,
      options: withColor,
    }, {
      key: 'cat',
      label: i18n.global.tc('NN0876'),
      plan: 1,
      options: noColor,
    }, {
      key: 'cat-custom',
      label: i18n.global.tc('NN0877'),
      plan: 1,
      options: withColor,
    }, {
      key: 'rabbit',
      label: i18n.global.tc('NN0878'),
      options: noColor,
    }, {
      key: 'rabbit-custom',
      label: i18n.global.tc('NN0879'),
      options: withColor,
    }, {
      key: 'dog',
      label: i18n.global.tc('NN0880'),
      plan: 1,
      options: noColor,
    }, {
      key: 'dog-custom',
      label: i18n.global.tc('NN0881'),
      options: withColor,
    }, {
      key: 'star',
      label: i18n.global.tc('NN0882'),
      plan: 1,
      options: withColor,
    }, {
      key: 'baby',
      label: i18n.global.tc('NN0883'),
      options: noColor,
    }, {
      key: 'paper-tap',
      label: i18n.global.tc('NN0895'),
      plan: 1,
      options: withColor,
    }, {
      key: 'paper-tap-point',
      label: i18n.global.tc('NN0896'),
      options: withColor,
    }, {
      key: 'paper-tap-stripe',
      label: i18n.global.tc('NN0897'),
      plan: 1,
      options: withColor,
    }, {
      key: 'paper-tap-grid',
      label: i18n.global.tc('NN0898'),
      plan: 1,
      options: withColor,
    }, {
      key: 'triangle-flag',
      label: i18n.global.tc('NN0900'),
      plan: 1,
      options: noColor,
    }, {
      key: 'triangle-flag-custom',
      label: i18n.global.tc('NN0901'),
      options: withColor,
    }, {
      key: 'rectangle-flag',
      label: i18n.global.tc('NN0902'),
      plan: 1,
      options: noColor,
    }, {
      key: 'rectangle-flag-custom',
      label: i18n.global.tc('NN0903'),
      options: withColor,
    }, ...store.getters['user/isAdmin'] ? [{
      key: 'stretch-dog',
      label: i18n.global.tc('NN0914'),
      plan: 1,
      options: noColor,
    }, {
      key: 'stretch-rabbit',
      label: i18n.global.tc('NN0915'),
      plan: 1,
      options: noColor,
    }, {
      key: 'stretch-cat',
      label: i18n.global.tc('NN0916'),
      plan: 1,
      options: noColor,
    }, {
      key: 'stretch-dragon',
      label: i18n.global.tc('NN0917'),
      options: noColor,
    }] : []]
  }

  getLetterBgSetting(textBg: ITextLetterBg, index: number, head: boolean, tail: boolean) {
    let [href, color] = [textBg.name as string, textBg.color]
    switch (textBg.name) {
      case 'rainbow':
        href = 'rainbow-circle'
        color = ['#FFA19B', '#FFC89F', '#F7DE97', '#C5DFAE', '#B5D0F9', '#EDD4F6'][index % 6]
        break
      case 'rainbow-dark':
        href = 'rainbow-circle'
        color = ['#D0B0B1', '#DCC9BF', '#EBDEBB', '#BECBBC', '#B0BCC5', '#D1CADF'][index % 6]
        break
      case 'circle':
        href = 'rainbow-circle'
        break
      case 'heart':
        href = 'solid-heart'
        color = ['#BFE29A', '#ABDAED', '#FFBDC5', '#FFE299', '#CDBFDD', '#9BBCDD', '#F2C3AF'][index % 7]
        break
      case 'heart-warm':
        href = 'solid-heart'
        color = ['#9B5642', '#E48479', '#F7C3B0', '#D6805B', '#D45847', '#FAAE9F', '#F7C3B0'][index % 7]
        break
      case 'heart-custom':
        href = 'solid-heart'
        break
      case 'flower-frame':
        href = `flower-frame${index % 5}`
        color = ['#F4D0E0', '#BDDBD0', '#D9CCED', '#C7DAEF', '#F4CAC1'][index % 5]
        break
      case 'flower-frame-custom':
        href = `flower-frame${index % 5}`
        break
      case 'vintage-flower':
        color = ['#E8A98E', '#EE8854', '#F3B132', '#94A084', '#B17357'][index % 5]
        break
      // LetterBg that has loop N.
      case 'bear':
      case 'rabbit':
      case 'dog':
      case 'star':
        href += index % 3
        break
      case 'cloud':
      case 'triangle-flag':
        href += index % 4
        break
      case 'penguin':
      case 'planet':
      case 'gummybear':
      case 'leaf':
      case 'butter-flower':
      case 'cat-paw':
      case 'bread':
      case 'cat':
      case 'baby':
      case 'rectangle-flag':
        href += index % 5
        break
      // LetterBg that has head/tail.
      case 'paper-tap':
      case 'paper-tap-point':
      case 'paper-tap-stripe':
      case 'paper-tap-grid':
      case 'stretch-dog':
      case 'stretch-rabbit':
      case 'stretch-cat':
      case 'stretch-dragon':
        href += head ? '-head' : tail ? '-tail' : '0'
        break
      // text-book, *-custom
      default:
    }
    return { href, color }
  }

  getDeafultOptions(): Record<ITextLetterBgName, Record<string, number | boolean | string>> {
    const letterBgDefault = {
      xOffset200: 0,
      yOffset200: 0,
      size: 100,
      opacity: 100,
      fixedWidth: true,
      color: '', // no effect
    } as const

    return {
      rainbow: letterBgDefault,
      'rainbow-dark': letterBgDefault,
      circle: {
        ...letterBgDefault,
        color: '#EEDFD1',
      },
      cloud: {
        ...letterBgDefault,
        size: 180,
        fixedWidth: false, //!
        color: '#D3E2E3',
      },
      'text-book': {
        ...letterBgDefault,
        size: 125,
        color: '#93BAA6',
      },
      penguin: {
        ...letterBgDefault,
        yOffset200: -1,
        size: 200,
      },
      planet: {
        ...letterBgDefault,
        size: 135,
      },
      heart: {
        ...letterBgDefault,
        yOffset200: -3,
        size: 135,
      },
      'heart-warm': {
        ...letterBgDefault,
        yOffset200: -3,
        size: 135,
      },
      'heart-custom': {
        ...letterBgDefault,
        yOffset200: -3,
        size: 135,
        color: '#FFB6C4',
      },
      gummybear: {
        ...letterBgDefault,
        yOffset200: -15,
        size: 150,
      },
      leaf: {
        ...letterBgDefault,
        yOffset200: -7,
        size: 165,
      },
      'butter-flower': {
        ...letterBgDefault,
        size: 140,
        color: '#F4E4BD',
      },
      'flower-frame': {
        ...letterBgDefault,
        size: 140,
      },
      'flower-frame-custom': {
        ...letterBgDefault,
        size: 140,
        color: '#BDDBD0',
      },
      'vintage-flower': {
        ...letterBgDefault,
        yOffset200: -3,
        size: 160,
      },
      'vintage-flower-custom': {
        ...letterBgDefault,
        yOffset200: -3,
        size: 130,
        color: '#E8A98E',
      },
      'cat-paw': {
        ...letterBgDefault,
        size: 135,
      },
      bread: {
        ...letterBgDefault,
        size: 155,
      },
      bear: {
        ...letterBgDefault,
        yOffset200: -4,
        size: 150,
      },
      'bear-custom': {
        ...letterBgDefault,
        yOffset200: -4,
        size: 150,
        color: '#D2B29A',
      },
      cat: {
        ...letterBgDefault,
        yOffset200: -8,
        size: 155,
      },
      'cat-custom': {
        ...letterBgDefault,
        yOffset200: -8,
        size: 155,
        color: '#EADAD0',
      },
      rabbit: {
        ...letterBgDefault,
        yOffset200: -15,
        size: 150,
      },
      'rabbit-custom': {
        ...letterBgDefault,
        yOffset200: -15,
        size: 150,
        color: '#F2D7D1',
      },
      dog: {
        ...letterBgDefault,
        size: 160,
      },
      'dog-custom': {
        ...letterBgDefault,
        size: 160,
        color: '#CCA08F',
      },
      star: {
        ...letterBgDefault,
        size: 170,
        color: '#FFD95F',
      },
      baby: {
        ...letterBgDefault,
        yOffset200: -3,
        size: 160,
      },
      'paper-tap': {
        ...letterBgDefault,
        size: 150,
        color: '#F9DDC5',
      },
      'paper-tap-point': {
        ...letterBgDefault,
        size: 150,
        color: '#FFCFCF',
      },
      'paper-tap-stripe': {
        ...letterBgDefault,
        size: 150,
        color: '#C7DDD8',
      },
      'paper-tap-grid': {
        ...letterBgDefault,
        size: 150,
        color: '#D3DDAC',
      },
      'triangle-flag': {
        ...letterBgDefault,
        yOffset200: 60,
        size: 225,
      },
      'triangle-flag-custom': {
        ...letterBgDefault,
        yOffset200: 50,
        size: 200,
        color: '#99D3D3',
      },
      'rectangle-flag': {
        ...letterBgDefault,
        yOffset200: 20,
        size: 155,
      },
      'rectangle-flag-custom': {
        ...letterBgDefault,
        yOffset200: 20,
        size: 155,
        color: '#FFBBD0'
      },
      'stretch-dog': {
        ...letterBgDefault,
        yOffset200: 10,
        size: 180,
      },
      'stretch-rabbit': {
        ...letterBgDefault,
        size: 180,
      },
      'stretch-cat': {
        ...letterBgDefault,
        yOffset200: 5,
        size: 180,
      },
      'stretch-dragon': {
        ...letterBgDefault,
        yOffset200: 10,
        size: 220,
      },
    }
  }

  async setExtraDefaultAttrs(name: string) {
    const defaultAttrs = {
      rainbow: {
        lineHeight: 1.78, fontSpacing: 585
      },
      'rainbow-dark': {
        lineHeight: 1.78, fontSpacing: 585
      },
      circle: {
        lineHeight: 1.78, fontSpacing: 585
      },
      cloud: {
        lineHeight: 1.54, fontSpacing: 186
      },
      'text-book': {
        lineHeight: 1.96, fontSpacing: 665
      },
      penguin: {
        lineHeight: 1.96, fontSpacing: 800
      },
      planet: {
        lineHeight: 1.96, fontSpacing: 410
      },
      heart: {
        lineHeight: 1.96, fontSpacing: 505
      },
      'heart-warm': {
        lineHeight: 1.96, fontSpacing: 505
      },
      'heart-custom': {
        lineHeight: 1.96, fontSpacing: 505
      },
      gummybear: {
        lineHeight: 1.96, fontSpacing: 800
      },
      leaf: {
        lineHeight: 1.96, fontSpacing: 800
      },
      'butter-flower': {
        lineHeight: 1.96, fontSpacing: 900
      },
      'flower-frame': {
        lineHeight: 1.96, fontSpacing: 950
      },
      'flower-frame-custom': {
        lineHeight: 1.96, fontSpacing: 950
      },
      'vintage-flower': {
        lineHeight: 1.96, fontSpacing: 1300
      },
      'vintage-flower-custom': {
        lineHeight: 1.96, fontSpacing: 950
      },
      'cat-paw': {
        lineHeight: 1.96, fontSpacing: 950
      },
      bread: {
        lineHeight: 1.96, fontSpacing: 1200
      },
      bear: {
        lineHeight: 1.96, fontSpacing: 1300
      },
      'bear-custom': {
        lineHeight: 1.96, fontSpacing: 1300
      },
      cat: {
        lineHeight: 1.96, fontSpacing: 1300
      },
      'cat-custom': {
        lineHeight: 1.96, fontSpacing: 1300
      },
      rabbit: {
        lineHeight: 1.96, fontSpacing: 1200
      },
      'rabbit-custom': {
        lineHeight: 1.96, fontSpacing: 1200
      },
      dog: {
        lineHeight: 1.96, fontSpacing: 1350
      },
      'dog-custom': {
        lineHeight: 1.96, fontSpacing: 1350
      },
      star: {
        lineHeight: 1.96, fontSpacing: 1350
      },
      baby: {
        lineHeight: 1.96, fontSpacing: 1300
      },
      'paper-tap': {
        lineHeight: 2.4, fontSpacing: 350
      },
      'paper-tap-point': {
        lineHeight: 2.4, fontSpacing: 430
      },
      'paper-tap-stripe': {
        lineHeight: 2, fontSpacing: 85
      },
      'paper-tap-grid': {
        lineHeight: 2.4, fontSpacing: 240
      },
      'triangle-flag': {
        lineHeight: 1.96, fontSpacing: 2000
      },
      'triangle-flag-custom': {
        lineHeight: 1.96, fontSpacing: 1650
      },
      'rectangle-flag': {
        lineHeight: 1.96, fontSpacing: 1010
      },
      'rectangle-flag-custom': {
        lineHeight: 1.96, fontSpacing: 1010
      },
      'stretch-dog': {
        lineHeight: 1.96, fontSpacing: 350,
      },
      'stretch-rabbit': {
        lineHeight: 1.96, fontSpacing: 280,
      },
      'stretch-cat': {
        lineHeight: 1.96, fontSpacing: 270,
      },
      'stretch-dragon': {
        lineHeight: 1.96, fontSpacing: 190,
      },
    } as Record<string, Record<'lineHeight' | 'fontSpacing', number>>

    for (const [key, val] of Object.entries(defaultAttrs[name] ?? {})) {
      await textUtils.setParagraphProp(key as 'lineHeight' | 'fontSpacing', val)
    }
  }

  // The beginning and end of the text BG are fixed, only the middle loops.
  fixedHeadTail(name: ITextLetterBgName) {
    return /(paper-tap|stretch-)/
      .test(name)
  }

  // Need to add BG to head and tail.
  extraHeadTail(name: ITextLetterBgName) {
    return /(stretch-)/
      .test(name)
  }

  isColorChangeable(href: string) {
    return /(cloud|rainbow-circle|solid-heart|text-book|butter-flower|flower-frame|vintage-flower|-custom|star|paper-tap)/
      .test(href)
  }

  bgNeedRotate(name: ITextLetterBgName) {
    return /(paper-tap|stretch-)/.test(name)
  }
}
export default new LetterBGData()
