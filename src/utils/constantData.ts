import store from '@/store'
import i18n from '@/i18n'
import { TranslateResult } from 'vue-i18n'
import brandkitUtils from './brandkitUtils'
import _ from 'lodash'

interface BillingInfoInput {
  label: TranslateResult
  ph?: TranslateResult
  key?: string
  optional?: boolean
  error?: string
}

class PaymentData {
  isLogin(): boolean {
    return store.getters['user/isLogin']
  }

  // For header.vue and mobileMenu.vue
  headerItem(mobile = false) {
    const tutorialPage = {
      tw: 'https://blog.vivipic.com/tw/tutorial/',
      us: 'https://blog.vivipic.com/us-tutorial/',
      jp: 'https://www.facebook.com/vivipicjp'
    }
    const faqPage = {
      tw: 'https://blog.vivipic.com/tw/faq/',
      us: 'https://blog.vivipic.com/us-faq/',
      jp: 'https://www.facebook.com/vivipicjp'
    }

    const list = [{
      condition: true,
      name: 'Home',
      url: '/',
      label: i18n.t('NN0144')
    }, {
      condition: true,
      name: 'TemplateCenter',
      url: '/templates',
      label: i18n.t('NN0145')
    }, {
      condition: true,
      name: 'Toturial',
      url: tutorialPage[i18n.locale as keyof typeof tutorialPage],
      label: i18n.t('NN0146')
    }, {
      condition: true,
      name: 'Faq',
      url: faqPage[i18n.locale as keyof typeof faqPage],
      label: i18n.t('NN0147')
    }, {
      condition: this.isLogin(),
      name: 'Pricing',
      url: '/pricing',
      label: i18n.t('TMP0139')
    }, {
      condition: this.isLogin(),
      name: 'MyDesign',
      url: '/mydesign',
      label: i18n.t('NN0080')
    }, {
      condition: this.isLogin() && brandkitUtils.isBrandkitAvailable, // todelete isBrandkitAvailable
      name: 'BrandKit',
      url: '/brandkit',
      label: i18n.t('NN0007')
    }]
    if (mobile) return _.filter(list, (it: Record<string, string>) => !['MyDesign', 'BrandKit'].includes(it.name))
    else return list
  }

  // For Settings
  viewList(all = false) {
    const list = [{
      name: 'menu',
      label: i18n.tc('TMP0145'),
      hidden: true
    }, {
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
      label: i18n.t('TMP0081'),
      icon: 'pro'
    }, {
      name: 'billing',
      label: i18n.t('TMP0110'),
      icon: 'invoice'
    }]
    if (all) return list
    else return _.filter(list, (it: Record<string, string>) => !it.hidden)
  }

  // For Pricing.vue
  colorBlock() {
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
      label: i18n.t('TMP0010'),
      value: 'monthly'
    }, {
      label: i18n.t('TMP0011'),
      value: 'yearly'
    }]
  }

  compareTable() {
    return [
      i18n.t('TMP0016'), i18n.t('TMP0017'), i18n.t('TMP0018'),
      i18n.t('TMP0019'), '-', true,
      i18n.t('TMP0020'), true, true,
      i18n.t('TMP0021'), true, true,
      i18n.t('TMP0022'), '1GB', '100GB',
      i18n.t('TMP0023'), true, true,
      i18n.t('TMP0024'), '-', true,
      i18n.t('TMP0025'), '-', true,
      i18n.t('TMP0026'), true, true,
      i18n.t('TMP0027'), true, true,
      i18n.t('TMP0028'), true, true
    ]
  }

  addLink(text: string):string {
    const link = text.match(/(https:\/\/[\w./]+)/)?.[0] as string
    return text.replace(link, `<a href=${link}>${link}</a>`)
  }

  faqs() {
    return [
      { Q: i18n.t('TMP0030'), A: i18n.t('TMP0031') },
      { Q: i18n.t('TMP0032'), A: i18n.t('TMP0033') },
      { Q: i18n.t('TMP0034'), A: this.addLink(i18n.t('TMP0035') as string) },
      { Q: i18n.t('TMP0036'), A: i18n.t('TMP0037') },
      { Q: i18n.t('TMP0038'), A: i18n.t('TMP0039') },
      { Q: i18n.t('TMP0146'), A: i18n.t('TMP0147') }
    ]
  }

  // For PopupPayment.vue
  cancel1() {
    return [
      i18n.t('TMP0066'),
      i18n.t('TMP0067'),
      i18n.t('TMP0068'),
      i18n.t('TMP0069')
    ]
  }

  cancel2() {
    return [
      i18n.t('TMP0073'),
      i18n.t('TMP0074'),
      i18n.t('TMP0075'),
      i18n.t('TMP0076'),
      i18n.t('TMP0077'),
      i18n.t('TMP0078')
    ]
  }

  // For SettingsPayment.vue billing info input
  country():BillingInfoInput[] {
    return [{
      label: 'country',
      key: 'country'
    }]
  }

  gerneral():BillingInfoInput[] {
    return [{
      label: i18n.tc('NN0173', 1) as string,
      ph: i18n.t('TMP0098') as string,
      key: 'email',
      error: i18n.t('NN0297') as string
    }, {
      label: i18n.t('NN0172') as string,
      ph: i18n.t('TMP0099') as string,
      key: 'name'
    }]
  }

  TWonly():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0053') as string,
      ph: i18n.t('TMP0053') as string,
      key: 'phone',
      error: i18n.t('TMP0128') as string
    }, {
      label: i18n.t('TMP0054') as string,
      ph: i18n.t('TMP0055') as string,
      key: 'GUI',
      optional: true,
      error: i18n.t('TMP0129') as string
    }]
  }

  USonly():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0100') as string,
      ph: i18n.t('TMP0101') as string,
      key: 'company',
      optional: true
    }, {
      label: i18n.t('TMP0104', { number: 1 }) as string,
      ph: i18n.t('TMP0105') as string,
      key: 'address1'
    }, {
      label: i18n.t('TMP0104', { number: 2 }) as string,
      ph: i18n.t('TMP0106') as string,
      key: 'address2',
      optional: true
    }, {
      label: i18n.t('TMP0107') as string,
      ph: i18n.t('TMP0107') as string,
      key: 'city'
    }, {
      label: 'state & zip',
      key: 'zip',
      error: i18n.t('TMP0130') as string
    }]
  }

  others():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0100') as string,
      ph: i18n.t('TMP0101') as string,
      key: 'company',
      optional: true
    }, {
      label: i18n.t('TMP0102') as string,
      ph: i18n.t('TMP0103') as string,
      key: 'address1'
    }]
  }

  // For SettingPayment.vue dropdown
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

export default new PaymentData()
