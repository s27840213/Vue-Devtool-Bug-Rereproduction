import store from '@/store'
import i18n from '@/i18n'
import { TranslateResult } from 'vue-i18n'
import { Itheme } from '@/interfaces/theme'
import themeUtils from './themeUtils'
import _ from 'lodash'

interface BillingInfoInput {
  label: TranslateResult
  ph?: TranslateResult
  key?: string
  optional?: boolean
  error?: string
}
export interface IEffectOption {
  key: string
  label: string
  type: 'range' | 'color' | 'select'
  min?: number
  max?: number
  select?: {key: string, label: string}[]
}
export interface IEffect {
  key: string
  label: string
  options: IEffectOption[]
}
export interface IEffectCategory {
  name: string
  label: string
  effects2d: IEffect[][]
}

class ConstantData {
  get isLogin(): boolean {
    return store.getters['user/isLogin']
  }

  // For header.vue and mobileMenu.vue
  headerItems(mobile = false) {
    function themeItem(id: number | number[]) {
      if (id instanceof Array) {
        let templateName = _.filter(store.getters.getEditThemes, (theme: Itheme) => {
          return id.includes(theme.id)
        })?.[0]?.title
        templateName = templateName?.split('(')?.[0]
        return {
          label: templateName,
          url: `/templates?themes=${id.join(',')}&sort=recent`
        }
      } else {
        const template = _.filter(store.getters.getEditThemes, ['id', id])?.[0]
        return {
          label: template?.title,
          url: `/templates?themes=${id}&sort=recent`
        }
      }
    }
    const templateType = {
      tw: [{
        label: i18n.t('NN0667'),
        content: [{
          label: 'FB 貼文',
          url: 'https://blog.vivipic.com/tw/facebook-post/'
        }, {
          label: 'FB 粉絲頁封面',
          url: 'https://blog.vivipic.com/tw/facebook-cover-2/'
        }, {
          label: 'IG 貼文',
          url: 'https://blog.vivipic.com/tw/ig-post-design/'
        },
        ...[3, 9, 4, [14, 15], 21].map((id) => themeItem(id))
        ]
      }, {
        label: i18n.t('NN0668'),
        content: [{
          label: '電商商品圖',
          url: 'https://blog.vivipic.com/tw/ecimage/'
        }, {
          label: '電商 Banner',
          url: 'https://blog.vivipic.com/tw/ec-banner/'
        },
        ...[7].map((id) => themeItem(id))
        ]
      }, {
        label: i18n.t('NN0669'),
        content: [{
          label: '喜帖',
          url: 'https://blog.vivipic.com/tw/wedding-invitation/'
        }, {
          label: '邀請卡',
          url: 'https://blog.vivipic.com/tw/invitation-card/'
        },
        ...[20, 19, 18, 22].map((id) => themeItem(id))
        ]
      }],
      us: [{
        label: i18n.t('NN0667'),
        content: [
          ...[1].map((id) => themeItem(id)), {
            label: 'Facebook Cover',
            url: 'https://blog.vivipic.com/us/facebook-cover/'
          },
          ...[2, 3].map((id) => themeItem(id)), {
            label: 'Youtube Thumbnail',
            url: 'https://blog.vivipic.com/us/youtube-thumbnail/'
          }, {
            label: 'Profile Picture (PFP)',
            url: 'https://blog.vivipic.com/us/pfp-profile-pictures/'
          }]
      }, {
        label: i18n.t('NN0668'),
        content: [5, 6].map((id) => themeItem(id))
      }, {
        label: i18n.t('NN0669'),
        content: [{
          label: 'Invitation',
          url: 'https://blog.vivipic.com/us/invitations/'
        }, {
          label: 'Polaroid Frame',
          url: 'https://blog.vivipic.com/us/free-polaroid-frame-templates/'
        }]
      }],
      jp: [{
        label: i18n.t('NN0667'),
        content: [
          ...[1, 8, 2, 3, 4, 9].map((id) => themeItem(id)), {
            label: 'プロフィール写真',
            url: 'https://blog.vivipic.com/jp/pfp-profile-pictures-2/'
          }
        ]
      }, {
        label: i18n.t('NN0668'),
        content: [5, 6, 7].map((id) => themeItem(id))
      }, {
        label: i18n.t('NN0669'),
        content: [{
          label: 'ポラロイドフレーム',
          url: 'https://blog.vivipic.com/jp/free-polaroid-frame-templates-2/'
        }, {
          label: '招待状',
          url: 'https://blog.vivipic.com/jp/invitation/'
        }]
      }]
    }
    const resource = {
      tw: [{
        label: i18n.t('NN0671'),
        url: 'https://blog.vivipic.com/tw/'
      }, {
        label: i18n.t('NN0672'),
        content: [{
          label: i18n.t('NN0673'),
          url: 'https://blog.vivipic.com/tw/tutorial/'
        }, {
          label: i18n.t('NN0147'),
          url: 'https://blog.vivipic.com/tw/faq/'
        }]
      }, {
        label: i18n.t('NN0674'),
        content: [{
          label: i18n.t('NN0675'),
          url: 'https://blog.vivipic.com/tw/新手入門/'
        }, {
          label: i18n.t('NN0676'),
          url: 'https://blog.vivipic.com/tw/設計教學/'
        }, {
          label: i18n.t('NN0677'),
          url: 'https://blog.vivipic.com/tw/數位行銷/'
        }, {
          label: i18n.t('NN0678'),
          url: 'https://blog.vivipic.com/tw/趨勢分享/'
        }]
      }],
      us: [{
        label: 'Features',
        content: [{
          label: 'Objects',
          url: 'https://blog.vivipic.com/us/objects/'
        }]
      }, {
        label: i18n.t('NN0672'),
        content: [{
          label: i18n.t('NN0673'),
          url: 'https://blog.vivipic.com/us/us-tutorial/'
        }, {
          label: i18n.t('NN0147'),
          url: 'https://blog.vivipic.com/us/us-faq/'
        }]
      }, {
        label: i18n.t('NN0671'),
        url: 'https://blog.vivipic.com/us/',
        content: [{
          label: i18n.t('NN0675'),
          url: 'https://blog.vivipic.com/us/category/tutorial-us/'
        }, {
          label: i18n.t('NN0676'),
          url: 'https://blog.vivipic.com/us/category/design-us/'
        }, {
          label: i18n.t('NN0677'),
          url: 'https://blog.vivipic.com/us/category/digital-marketing-us/'
        }, {
          label: i18n.t('NN0678'),
          url: 'https://blog.vivipic.com/us/category/trend-us/'
        }]
      }],
      jp: [{
        label: i18n.t('NN0671'),
        url: 'https://blog.vivipic.com/jp/'
      }, {
        label: i18n.t('NN0672'),
        content: [{
          label: i18n.t('NN0673'),
          url: 'https://blog.vivipic.com/jp/4step/'
        }]
      }, {
        label: i18n.t('NN0674'),
        content: [{
          label: i18n.t('NN0677'),
          url: 'https://blog.vivipic.com/jp/category/digital-marketing-jp/'
        }]
      }]
    }

    const list = [{
      label: i18n.t('NN0666'),
      content: templateType[i18n.locale as keyof typeof templateType]
    }, {
      name: 'TemplateCenter',
      url: '/templates',
      label: i18n.t('NN0145')
    }, {
      label: i18n.t('NN0670'),
      content: resource[i18n.locale as keyof typeof resource]
    }, {
      name: 'Pricing',
      url: '/pricing',
      label: i18n.t('NN0643')
    }, {
      hidden: !this.isLogin,
      name: 'MyDesign',
      url: '/mydesign',
      label: i18n.t('NN0080')
    }, {
      hidden: !this.isLogin,
      name: 'BrandKit',
      url: '/brandkit',
      label: i18n.t('NN0007')
    }]
    themeUtils.checkThemeState()
    if (mobile) return _.filter(list, (it: Record<string, string>) => !['BrandKit'].includes(it.name))
    else return list
  }

  // For TextEffectSetting
  textEffects() {
    function arrTo2darr(arr: Array<unknown>) {
      const newArr = []
      while (arr.length) newArr.push(arr.splice(0, 3))
      return newArr
    }

    function toOptions(array: string[]) {
      const effectI18nMap = {
        distance: i18n.tc('NN0063'),
        angle: i18n.tc('NN0064'),
        blur: i18n.tc('NN0065'),
        opacity: i18n.tc('NN0066'),
        color: i18n.tc('NN0067'),
        spread: i18n.tc('NN0068'),
        stroke: i18n.tc('NN0069'),
        shape: i18n.tc('NN0070'),
        bend: i18n.tc('NN0071'),
        bStroke: i18n.tc('NN0733'),
        bColor: i18n.tc('NN0734'),
        bRadius: i18n.tc('NN0086'),
        pStroke: i18n.tc('NN0319'),
        pColor: i18n.tc('NN0735'),
        height: i18n.tc('NN0319'),
        yOffset: i18n.tc('NN0736'),
        distanceInverse: i18n.tc('NN0737'),
        textStrokeColor: i18n.tc('NN0739'),
        shadowStrokeColor: i18n.tc('NN0740'),
        endpoint: i18n.tc('NN0738')
      }

      return array.map((name: string) => {
        const option = {
          key: name,
          label: effectI18nMap[name as keyof typeof effectI18nMap]
        } as IEffectOption

        option.type = 'range'
        if (name.toLocaleLowerCase().endsWith('color')) {
          option.type = 'color'
        }
        switch (name) {
          case 'endpoint':
            option.type = 'select'
            option.select = [{
              key: 'triangle',
              label: i18n.tc('NN0730')
            }, {
              key: 'rounded',
              label: i18n.tc('NN0731')
            }, {
              key: 'square',
              label: i18n.tc('NN0732')
            }]
            break
          case 'angle':
            option.max = 180
            option.min = -180
            break
          case 'bend': // For curve
            option.max = 100
            option.min = -100
            break
          default:
            /* distance, blur, opacity, spread, stroke,
             * bStroke, pStroke, bRadius, height */
            option.max = 100
            option.min = 0
            break
        }
        return option
      })
    }

    const categories = [{
      name: 'shadow',
      label: i18n.t('NN0112'),
      effects2d: arrTo2darr([{
        key: 'none',
        label: i18n.t('NN0111'),
        options: toOptions([])
      }, {
        key: 'shadow',
        label: i18n.t('NN0112'),
        options: toOptions(['distance', 'angle', 'blur', 'opacity', 'color'])
      }, {
        key: 'lift',
        label: i18n.t('NN0113'),
        options: toOptions(['spread'])
      }, {
        key: 'hollow',
        label: i18n.t('NN0114'),
        options: toOptions(['stroke'])
      }, {
        key: 'splice',
        label: i18n.t('NN0115'),
        options: toOptions(['stroke', 'distance', 'angle', 'color'])
      }, {
        key: 'echo',
        label: i18n.t('NN0116'),
        options: toOptions(['distance', 'angle', 'color'])
      }, {
        key: 'funky3d',
        label: i18n.tc('NN0728'),
        options: toOptions(['distance', 'distanceInverse', 'angle', 'opacity', 'color'])
      }, {
        key: 'bold3d',
        label: i18n.tc('NN0729'),
        options: toOptions(['distance', 'angle', 'opacity', 'textStrokeColor', 'shadowStrokeColor', 'color'])
      }])
    }, {
      name: 'shape',
      label: i18n.t('NN0070'),
      effects2d: arrTo2darr([{
        key: 'none',
        label: i18n.t('NN0117'),
        options: toOptions([])
      }, {
        key: 'curve',
        label: i18n.t('NN0118'),
        options: toOptions(['bend'])
      }])
    }, {
      name: 'bg',
      label: i18n.tc('NN0719'),
      effects2d: arrTo2darr([{
        key: 'none',
        label: i18n.t('NN0111'),
        options: toOptions([])
      }, {
        key: 'square-borderless',
        label: i18n.tc('NN0720'),
        options: toOptions(['opacity', 'pStroke', 'pColor'])
      }, {
        key: 'rounded-borderless',
        label: i18n.tc('NN0721'),
        options: toOptions(['opacity', 'bRadius', 'pStroke', 'pColor'])
      }, {
        key: 'square-hollow',
        label: i18n.tc('NN0722'),
        options: toOptions(['opacity', 'bStroke', 'bColor', 'pStroke'])
      }, {
        key: 'rounded-hollow',
        label: i18n.tc('NN0723'),
        options: toOptions(['opacity', 'bRadius', 'bStroke', 'bColor', 'pStroke'])
      }, {
        key: 'square-both',
        label: i18n.tc('NN0724'),
        options: toOptions(['opacity', 'bStroke', 'bColor', 'pStroke', 'pColor'])
      }, {
        key: 'rounded-both',
        label: i18n.tc('NN0725'),
        options: toOptions(['opacity', 'bRadius', 'bStroke', 'bColor', 'pStroke', 'pColor'])
      }, {
        key: 'gooey',
        label: i18n.tc('NN0726'),
        options: toOptions(['distance', 'bRadius', 'opacity', 'color'])
      }, {
        key: 'underline',
        label: i18n.tc('NN0727'),
        options: toOptions(['endpoint', 'height', 'yOffset', 'opacity', 'color'])
      }])
    }]
    return categories as IEffectCategory[]
  }

  // For Settings
  settingsItems() {
    const list = [{
      name: 'account',
      label: i18n.tc('NN0165', 1),
      icon: 'settings'
    }, {
      name: 'security',
      label: i18n.tc('NN0166', 1),
      icon: 'lock'
    }, {
      name: 'hr'
    }, {
      name: 'payment',
      label: i18n.t('NN0585'),
      icon: 'pro'
    }, {
      name: 'billing',
      label: i18n.t('NN0614'),
      icon: 'invoice'
    }]
    return list
  }

  // For Pricing.vue
  pricingColorBlock() {
    return [{
      name: 'vector_pink1.svg',
      top: 171,
      left: -129
    }, {
      name: 'vector_green1.svg',
      top: 82,
      left: 70
    }, {
      name: 'vector_blue2.svg',
      top: -27,
      left: 363
    }, {
      name: 'oval_yellow1.svg',
      top: 73,
      left: 597
    }]
  }

  periodOptions() {
    return [{
      label: i18n.t('NN0514'),
      value: 'monthly'
    }, {
      label: i18n.t('NN0515'),
      value: 'yearly'
    }]
  }

  compareTable() {
    return [
      i18n.t('NN0520'), i18n.t('NN0521'), i18n.t('NN0522'),
      i18n.t('NN0523'), '-', true,
      i18n.t('NN0524'), true, true,
      i18n.t('NN0525'), true, true,
      i18n.t('NN0526'), '1GB', '100GB',
      i18n.t('NN0527'), true, true,
      i18n.t('NN0528'), '-', true,
      i18n.t('NN0529'), '-', true,
      i18n.t('NN0530'), true, true,
      i18n.t('NN0531'), true, true,
      i18n.t('NN0532'), true, true
    ]
  }

  addLink(text: string):string {
    const link = text.match(/(https:\/\/[\w./]+)/)?.[0] as string
    text = text.replace(link, `<a href=${link}>${link}</a>`)
    const email = text.match(/([\w]+@vivipic.com)/)?.[0] as string
    text = text.replace(email, `<a href=mailto:${email}>${email}</a>`)
    return text
  }

  faqs() {
    return [{
      Q: i18n.t('NN0534'),
      A: i18n.t('NN0535')
    }, {
      Q: i18n.t('NN0536'),
      A: this.addLink(i18n.t('NN0537') as string)
    }, {
      Q: i18n.t('NN0538'),
      A: this.addLink(i18n.t('NN0539') as string)
    }, {
      Q: i18n.t('NN0540'),
      A: i18n.t('NN0541')
    }, {
      Q: i18n.t('NN0542'),
      A: i18n.t('NN0543')
    }, {
      isPath: true,
      Q: i18n.t('NN0650'),
      A: 'NN0651'
    }]
  }

  // For PopupPayment.vue
  cancel1() {
    return [
      i18n.t('NN0570'),
      i18n.t('NN0571'),
      i18n.t('NN0572'),
      i18n.t('NN0573')
    ]
  }

  cancel2() {
    return [
      i18n.t('NN0577'),
      i18n.t('NN0578'),
      i18n.t('NN0579'),
      i18n.t('NN0580'),
      i18n.t('NN0581'),
      i18n.t('NN0582')
    ]
  }

  // For tappay and stripe config in PaymentField.vue
  tappayConfig() {
    return {
      fields: {
        number: {
          element: '#card-number',
          placeholder: '💳 信用卡卡號'
        },
        expirationDate: {
          element: '#card-date',
          placeholder: '到期日(MM / YY)'
        },
        ccv: {
          element: '#card-ccv',
          placeholder: '信用卡安全碼'
        }
      },
      styles: {
        input: {
          color: '#969BAB',
          'font-size': '16px'
        },
        ':focus': {
          color: 'black'
        },
        '.valid': {
          color: 'green'
        },
        '.invalid': {
          color: 'red'
        }
      }
    }
  }

  stripeOption() {
    return {
      fields: { billingDetails: { address: { country: 'never' } } },
      terms: { card: 'never' },
      wallets: {
        applePay: 'never',
        googlePay: 'never'
      }
    }
  }

  // For billing info input in PaymentField.vue and SettingsPayment.vue
  country():BillingInfoInput[] {
    return [{
      label: 'country',
      key: 'country'
    }]
  }

  gerneral():BillingInfoInput[] {
    return [{
      label: i18n.tc('NN0173', 1) as string,
      ph: i18n.t('NN0602') as string,
      key: 'email',
      error: i18n.t('NN0297') as string
    }, {
      label: i18n.t('NN0172') as string,
      ph: i18n.t('NN0603') as string,
      key: 'name'
    }]
  }

  TWonly():BillingInfoInput[] {
    return [{
      label: i18n.t('NN0557') as string,
      ph: i18n.t('NN0557') as string,
      key: 'phone',
      error: i18n.t('NN0632') as string
    }, {
      label: i18n.t('NN0558') as string,
      ph: i18n.t('NN0559') as string,
      key: 'GUI',
      optional: true,
      error: i18n.t('NN0633') as string
    }]
  }

  USonly():BillingInfoInput[] {
    return [{
      label: i18n.t('NN0604') as string,
      ph: i18n.t('NN0605') as string,
      key: 'company',
      optional: true
    }, {
      label: i18n.t('NN0608', { number: 1 }) as string,
      ph: i18n.t('NN0609') as string,
      key: 'address1'
    }, {
      label: i18n.t('NN0608', { number: 2 }) as string,
      ph: i18n.t('NN0610') as string,
      key: 'address2',
      optional: true
    }, {
      label: i18n.t('NN0611') as string,
      ph: i18n.t('NN0611') as string,
      key: 'city'
    }, {
      label: 'state & zip',
      key: 'zip',
      error: i18n.t('NN0634') as string
    }]
  }

  others():BillingInfoInput[] {
    return [{
      label: i18n.t('NN0604') as string,
      ph: i18n.t('NN0605') as string,
      key: 'company',
      optional: true
    }, {
      label: i18n.t('NN0606') as string,
      ph: i18n.t('NN0607') as string,
      key: 'address1'
    }]
  }

  // For country dropdown in PaymentField.vue and SettingPayment.vue
  countryList() {
    return [
      { value: 'af', label: 'Afghanistan' },
      { value: 'ax', label: 'Åland Islands' },
      { value: 'al', label: 'Albania' },
      { value: 'dz', label: 'Algeria' },
      { value: 'as', label: 'American Samoa' },
      { value: 'ad', label: 'Andorra' },
      { value: 'ao', label: 'Angola' },
      { value: 'ai', label: 'Anguilla' },
      { value: 'aq', label: 'Antarctica' },
      { value: 'ag', label: 'Antigua and Barbuda' },
      { value: 'ar', label: 'Argentina' },
      { value: 'am', label: 'Armenia' },
      { value: 'aw', label: 'Aruba' },
      { value: 'au', label: 'Australia' },
      { value: 'at', label: 'Austria' },
      { value: 'az', label: 'Azerbaijan' },
      { value: 'bs', label: 'Bahamas' },
      { value: 'bh', label: 'Bahrain' },
      { value: 'bd', label: 'Bangladesh' },
      { value: 'bb', label: 'Barbados' },
      { value: 'by', label: 'Belarus' },
      { value: 'be', label: 'Belgium' },
      { value: 'bz', label: 'Belize' },
      { value: 'bj', label: 'Benin' },
      { value: 'bm', label: 'Bermuda' },
      { value: 'bt', label: 'Bhutan' },
      { value: 'bo', label: 'Bolivia' },
      { value: 'bq', label: 'Bonaire, Sint Eustatius and Saba' },
      { value: 'ba', label: 'Bosnia and Herzegovina' },
      { value: 'bw', label: 'Botswana' },
      { value: 'br', label: 'Brazil' },
      { value: 'io', label: 'British Indian Ocean Territory' },
      { value: 'bn', label: 'Brunei Darussalam' },
      { value: 'bg', label: 'Bulgaria' },
      { value: 'bf', label: 'Burkina Faso' },
      { value: 'bi', label: 'Burundi' },
      { value: 'kh', label: 'Cambodia' },
      { value: 'cm', label: 'Cameroon' },
      { value: 'ca', label: 'Canada' },
      { value: 'cv', label: 'Cape Verde' },
      { value: 'ky', label: 'Cayman Islands' },
      { value: 'cf', label: 'Central African Republic' },
      { value: 'td', label: 'Chad' },
      { value: 'cl', label: 'Chile' },
      { value: 'cn', label: 'China' },
      { value: 'cx', label: 'Christmas Island' },
      { value: 'cc', label: 'Cocos (Keeling) Islands' },
      { value: 'co', label: 'Colombia' },
      { value: 'km', label: 'Comoros' },
      { value: 'cg', label: 'Congo' },
      { value: 'cd', label: 'Congo, The Democratic Republic of the' },
      { value: 'ck', label: 'Cook Islands' },
      { value: 'cr', label: 'Costa Rica' },
      { value: 'ci', label: "Côte d'Ivoire" },
      { value: 'hr', label: 'Croatia' },
      { value: 'cu', label: 'Cuba' },
      { value: 'cw', label: 'Curaçao' },
      { value: 'cy', label: 'Cyprus' },
      { value: 'cz', label: 'Czech Republic' },
      { value: 'dk', label: 'Denmark' },
      { value: 'dj', label: 'Djibouti' },
      { value: 'dm', label: 'Dominica' },
      { value: 'do', label: 'Dominican Republic' },
      { value: 'ec', label: 'Ecuador' },
      { value: 'eg', label: 'Egypt' },
      { value: 'sv', label: 'El Salvador' },
      { value: 'gq', label: 'Equatorial Guinea' },
      { value: 'er', label: 'Eritrea' },
      { value: 'ee', label: 'Estonia' },
      { value: 'sz', label: 'Eswatini' },
      { value: 'et', label: 'Ethiopia' },
      { value: 'fk', label: 'Falkland Islands (Malvinas)' },
      { value: 'fo', label: 'Faroe Islands' },
      { value: 'fj', label: 'Fiji' },
      { value: 'fi', label: 'Finland' },
      { value: 'fr', label: 'France' },
      { value: 'gf', label: 'French Guiana' },
      { value: 'pf', label: 'French Polynesia' },
      { value: 'tf', label: 'French Southern Territories' },
      { value: 'ga', label: 'Gabon' },
      { value: 'gm', label: 'Gambia' },
      { value: 'ge', label: 'Georgia' },
      { value: 'de', label: 'Germany' },
      { value: 'gh', label: 'Ghana' },
      { value: 'gi', label: 'Gibraltar' },
      { value: 'gr', label: 'Greece' },
      { value: 'gl', label: 'Greenland' },
      { value: 'gd', label: 'Grenada' },
      { value: 'gp', label: 'Guadeloupe' },
      { value: 'gu', label: 'Guam' },
      { value: 'gt', label: 'Guatemala' },
      { value: 'gg', label: 'Guernsey' },
      { value: 'gn', label: 'Guinea' },
      { value: 'gw', label: 'Guinea-Bissau' },
      { value: 'gy', label: 'Guyana' },
      { value: 'ht', label: 'Haiti' },
      { value: 'hm', label: 'Heard Island and McDonald Islands' },
      { value: 'va', label: 'Holy See (Vatican City State)' },
      { value: 'hn', label: 'Honduras' },
      { value: 'hk', label: 'Hong Kong' },
      { value: 'hu', label: 'Hungary' },
      { value: 'is', label: 'Iceland' },
      { value: 'in', label: 'India' },
      { value: 'id', label: 'Indonesia' },
      { value: 'xz', label: 'Installations in International Waters' },
      { value: 'ir', label: 'Iran, Islamic Republic of' },
      { value: 'iq', label: 'Iraq' },
      { value: 'ie', label: 'Ireland' },
      { value: 'im', label: 'Isle of Man' },
      { value: 'il', label: 'Israel' },
      { value: 'it', label: 'Italy' },
      { value: 'jm', label: 'Jamaica' },
      { value: 'jp', label: 'Japan' },
      { value: 'je', label: 'Jersey' },
      { value: 'jo', label: 'Jordan' },
      { value: 'kz', label: 'Kazakhstan' },
      { value: 'ke', label: 'Kenya' },
      { value: 'ki', label: 'Kiribati' },
      { value: 'kp', label: "Korea, Democratic People's Republic of" },
      { value: 'kr', label: 'Korea, Republic of' },
      { value: 'kw', label: 'Kuwait' },
      { value: 'kg', label: 'Kyrgyzstan' },
      { value: 'la', label: "Lao People's Democratic Republic" },
      { value: 'lv', label: 'Latvia' },
      { value: 'lb', label: 'Lebanon' },
      { value: 'ls', label: 'Lesotho' },
      { value: 'lr', label: 'Liberia' },
      { value: 'ly', label: 'Libya' },
      { value: 'li', label: 'Liechtenstein' },
      { value: 'lt', label: 'Lithuania' },
      { value: 'lu', label: 'Luxembourg' },
      { value: 'mo', label: 'Macao' },
      { value: 'mg', label: 'Madagascar' },
      { value: 'mw', label: 'Malawi' },
      { value: 'my', label: 'Malaysia' },
      { value: 'mv', label: 'Maldives' },
      { value: 'ml', label: 'Mali' },
      { value: 'mt', label: 'Malta' },
      { value: 'mh', label: 'Marshall Islands' },
      { value: 'mq', label: 'Martinique' },
      { value: 'mr', label: 'Mauritania' },
      { value: 'mu', label: 'Mauritius' },
      { value: 'yt', label: 'Mayotte' },
      { value: 'mx', label: 'Mexico' },
      { value: 'fm', label: 'Micronesia, Federated States of' },
      { value: 'md', label: 'Moldova, Republic of' },
      { value: 'mc', label: 'Monaco' },
      { value: 'mn', label: 'Mongolia' },
      { value: 'me', label: 'Montenegro' },
      { value: 'ms', label: 'Montserrat' },
      { value: 'ma', label: 'Morocco' },
      { value: 'mz', label: 'Mozambique' },
      { value: 'mm', label: 'Myanmar' },
      { value: 'na', label: 'Namibia' },
      { value: 'nr', label: 'Nauru' },
      { value: 'np', label: 'Nepal' },
      { value: 'nl', label: 'Netherlands' },
      { value: 'nc', label: 'New Caledonia' },
      { value: 'nz', label: 'New Zealand' },
      { value: 'ni', label: 'Nicaragua' },
      { value: 'ne', label: 'Niger' },
      { value: 'ng', label: 'Nigeria' },
      { value: 'nu', label: 'Niue' },
      { value: 'nf', label: 'Norfolk Island' },
      { value: 'mk', label: 'North Macedonia' },
      { value: 'mp', label: 'Northern Mariana Islands' },
      { value: 'no', label: 'Norway' },
      { value: 'om', label: 'Oman' },
      { value: 'pk', label: 'Pakistan' },
      { value: 'pw', label: 'Palau' },
      { value: 'ps', label: 'Palestine, State of' },
      { value: 'pa', label: 'Panama' },
      { value: 'pg', label: 'Papua New Guinea' },
      { value: 'py', label: 'Paraguay' },
      { value: 'pe', label: 'Peru' },
      { value: 'ph', label: 'Philippines' },
      { value: 'pn', label: 'Pitcairn' },
      { value: 'pl', label: 'Poland' },
      { value: 'pt', label: 'Portugal' },
      { value: 'pr', label: 'Puerto Rico' },
      { value: 'qa', label: 'Qatar' },
      { value: 're', label: 'Reunion' },
      { value: 'ro', label: 'Romania' },
      { value: 'ru', label: 'Russian Federation' },
      { value: 'rw', label: 'Rwanda' },
      { value: 'bl', label: 'Saint Barthélemy' },
      { value: 'sh', label: 'Saint Helena, Ascension and Tristan Da Cunha' },
      { value: 'kn', label: 'Saint Kitts and Nevis' },
      { value: 'lc', label: 'Saint Lucia' },
      { value: 'mf', label: 'Saint Martin (French Part)' },
      { value: 'pm', label: 'Saint Pierre and Miquelon' },
      { value: 'vc', label: 'Saint Vincent and the Grenadines' },
      { value: 'ws', label: 'Samoa' },
      { value: 'sm', label: 'San Marino' },
      { value: 'st', label: 'Sao Tome and Principe' },
      { value: 'sa', label: 'Saudi Arabia' },
      { value: 'sn', label: 'Senegal' },
      { value: 'rs', label: 'Serbia' },
      { value: 'sc', label: 'Seychelles' },
      { value: 'sl', label: 'Sierra Leone' },
      { value: 'sg', label: 'Singapore' },
      { value: 'sx', label: 'Sint Maarten (Dutch Part)' },
      { value: 'sk', label: 'Slovakia' },
      { value: 'si', label: 'Slovenia' },
      { value: 'sb', label: 'Solomon Islands' },
      { value: 'so', label: 'Somalia' },
      { value: 'za', label: 'South Africa' },
      { value: 'gs', label: 'South Georgia and the South Sandwich Islands' },
      { value: 'ss', label: 'South Sudan' },
      { value: 'es', label: 'Spain' },
      { value: 'lk', label: 'Sri Lanka' },
      { value: 'sd', label: 'Sudan' },
      { value: 'sr', label: 'Suriname' },
      { value: 'sj', label: 'Svalbard and Jan Mayen' },
      { value: 'se', label: 'Sweden' },
      { value: 'ch', label: 'Switzerland' },
      { value: 'sy', label: 'Syrian Arab Republic' },
      { value: 'tw', label: 'Taiwan' },
      { value: 'tj', label: 'Tajikistan' },
      { value: 'tz', label: 'Tanzania, United Republic of' },
      { value: 'th', label: 'Thailand' },
      { value: 'tl', label: 'Timor-Leste' },
      { value: 'tg', label: 'Togo' },
      { value: 'tk', label: 'Tokelau' },
      { value: 'to', label: 'Tonga' },
      { value: 'tt', label: 'Trinidad and Tobago' },
      { value: 'tn', label: 'Tunisia' },
      { value: 'tr', label: 'Turkey' },
      { value: 'tm', label: 'Turkmenistan' },
      { value: 'tc', label: 'Turks and Caicos Islands' },
      { value: 'tv', label: 'Tuvalu' },
      { value: 'ug', label: 'Uganda' },
      { value: 'ua', label: 'Ukraine' },
      { value: 'ae', label: 'United Arab Emirates' },
      { value: 'gb', label: 'United Kingdom' },
      { value: 'us', label: 'United States' },
      { value: 'um', label: 'United States Minor Outlying Islands' },
      { value: 'uy', label: 'Uruguay' },
      { value: 'uz', label: 'Uzbekistan' },
      { value: 'vu', label: 'Vanuatu' },
      { value: 've', label: 'Venezuela' },
      { value: 'vn', label: 'Viet Nam' },
      { value: 'vg', label: 'Virgin Islands, British' },
      { value: 'vi', label: 'Virgin Islands, U.S.' },
      { value: 'wf', label: 'Wallis and Futuna' },
      { value: 'eh', label: 'Western Sahara' },
      { value: 'ye', label: 'Yemen' },
      { value: 'zm', label: 'Zambia' },
      { value: 'zw', label: 'Zimbabwe' }
    ]
  }

  // For US state dropdown in SettingPayment.vue
  usState() {
    return [
      { value: 'Alabama', label: 'Alabama' },
      { value: 'Alaska', label: 'Alaska' },
      { value: 'Arizona', label: 'Arizona' },
      { value: 'Arkansas', label: 'Arkansas' },
      { value: 'California', label: 'California' },
      { value: 'Colorado', label: 'Colorado' },
      { value: 'Connecticut', label: 'Connecticut' },
      { value: 'Delaware', label: 'Delaware' },
      { value: 'Florida', label: 'Florida' },
      { value: 'Georgia', label: 'Georgia' },
      { value: 'Hawaii', label: 'Hawaii' },
      { value: 'Idaho', label: 'Idaho' },
      { value: 'Illinois', label: 'Illinois' },
      { value: 'Indiana', label: 'Indiana' },
      { value: 'Iowa', label: 'Iowa' },
      { value: 'Kansas', label: 'Kansas' },
      { value: 'Kentucky', label: 'Kentucky' },
      { value: 'Louisiana', label: 'Louisiana' },
      { value: 'Maine', label: 'Maine' },
      { value: 'Maryland', label: 'Maryland' },
      { value: 'Massachusetts', label: 'Massachusetts' },
      { value: 'Michigan', label: 'Michigan' },
      { value: 'Minnesota', label: 'Minnesota' },
      { value: 'Mississippi', label: 'Mississippi' },
      { value: 'Missouri', label: 'Missouri' },
      { value: 'Montana', label: 'Montana' },
      { value: 'Nebraska', label: 'Nebraska' },
      { value: 'Nevada', label: 'Nevada' },
      { value: 'New Hampshire', label: 'New Hampshire' },
      { value: 'New Jersey', label: 'New Jersey' },
      { value: 'New Mexico', label: 'New Mexico' },
      { value: 'New York', label: 'New York' },
      { value: 'North Carolina', label: 'North Carolina' },
      { value: 'North Dakota', label: 'North Dakota' },
      { value: 'Ohio', label: 'Ohio' },
      { value: 'Oklahoma', label: 'Oklahoma' },
      { value: 'Oregon', label: 'Oregon' },
      { value: 'Pennsylvania', label: 'Pennsylvania' },
      { value: 'Rhode Island', label: 'Rhode Island' },
      { value: 'South Carolina', label: 'South Carolina' },
      { value: 'South Dakota', label: 'South Dakota' },
      { value: 'Tennessee', label: 'Tennessee' },
      { value: 'Texas', label: 'Texas' },
      { value: 'Utah', label: 'Utah' },
      { value: 'Vermont', label: 'Vermont' },
      { value: 'Virginia', label: 'Virginia' },
      { value: 'Washington', label: 'Washington' },
      { value: 'West Virginia', label: 'West Virginia' },
      { value: 'Wisconsin', label: 'Wisconsin' },
      { value: 'Wyoming', label: 'Wyoming' }
    ]
  }
}

export default new ConstantData()
