import i18n from '@/i18n'
import { TranslateResult } from 'vue-i18n'

interface BillingInfoInput {
  label: TranslateResult
  ph?: TranslateResult
  key?: string
  error?: string
}

class PaymentData {
  // For Pricing.vue
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
      i18n.t('TMP0015'), i18n.t('TMP0016'), i18n.t('TMP0017'),
      i18n.t('TMP0018'), '-', true,
      i18n.t('TMP0019'), true, true,
      i18n.t('TMP0020'), true, true,
      i18n.t('TMP0021'), '1GB', '100GB',
      i18n.t('TMP0022'), true, true,
      i18n.t('TMP0023'), '-', true,
      i18n.t('TMP0024'), '-', true,
      i18n.t('TMP0025'), true, true,
      i18n.t('TMP0026'), true, true,
      i18n.t('TMP0027'), true, true
    ]
  }

  addLink(text: string):string {
    const link = text.match(/(https:\/\/[\w./]+)/)?.[0] as string
    return text.replace(link, `<a href=${link}>${link}</a>`)
  }

  faqs() {
    return [
      { Q: i18n.t('TMP0029'), A: i18n.t('TMP0030') },
      { Q: i18n.t('TMP0031'), A: i18n.t('TMP0032') },
      { Q: i18n.t('TMP0033'), A: this.addLink(i18n.t('TMP0034') as string) },
      { Q: i18n.t('TMP0035'), A: i18n.t('TMP0036') },
      { Q: i18n.t('TMP0037'), A: i18n.t('TMP0038') }
    ]
  }

  // For PopupPayment.vue
  cancel1() {
    return [
      i18n.t('TMP0061'),
      i18n.t('TMP0062'),
      i18n.t('TMP0063'),
      i18n.t('TMP0064')
    ]
  }

  cancel2() {
    return [
      i18n.t('TMP0068'),
      i18n.t('TMP0069'),
      i18n.t('TMP0070'),
      i18n.t('TMP0071'),
      i18n.t('TMP0072'),
      i18n.t('TMP0073')
    ]
  }

  // For SettingsPayment.vue billing info input
  country():BillingInfoInput[] {
    return [{ label: 'country' }]
  }

  gerneral():BillingInfoInput[] {
    return [{
      label: i18n.tc('NN0173', 1) as string,
      ph: i18n.t('TMP0093') as string,
      key: 'email',
      error: 'Invalid email format.'
    }, {
      label: i18n.t('NN0172') as string,
      ph: i18n.t('TMP0094') as string,
      key: 'name'
    }]
  }

  TWonly():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0050') as string,
      ph: i18n.t('TMP0051') as string,
      key: 'phone',
      error: 'Invalid phone format.'
    }, {
      label: i18n.t('TMP0052') as string,
      ph: i18n.t('TMP0053') as string,
      key: 'GUI',
      error: 'Invalid GUI format.'
    }]
  }

  USonly():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0095') as string,
      ph: i18n.t('TMP0096') as string,
      key: 'company'
    }, {
      label: i18n.t('TMP0099', { number: 1 }) as string,
      ph: i18n.t('TMP0100') as string,
      key: 'address1'
    }, {
      label: i18n.t('TMP0099', { number: 2 }) as string,
      ph: i18n.t('TMP0101') as string,
      key: 'address2'
    }, {
      label: i18n.t('TMP0102') as string,
      ph: i18n.t('TMP0102') as string,
      key: 'city'
    }, {
      label: 'state & zip',
      key: 'zip',
      error: 'Invalid zip format.'
    }]
  }

  others():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0095') as string,
      ph: i18n.t('TMP0096') as string,
      key: 'company'
    }, {
      label: i18n.t('TMP0097') as string,
      ph: i18n.t('TMP0098') as string,
      key: 'address1'
    }]
  }

  // For SettingPayment.vue dropdown
  countryList() {
    return [
      { value: 'AF', label: 'Afghanistan' },
      { value: 'AX', label: 'Åland Islands' },
      { value: 'AL', label: 'Albania' },
      { value: 'DZ', label: 'Algeria' },
      { value: 'AS', label: 'American Samoa' },
      { value: 'AD', label: 'Andorra' },
      { value: 'AO', label: 'Angola' },
      { value: 'AI', label: 'Anguilla' },
      { value: 'AQ', label: 'Antarctica' },
      { value: 'AG', label: 'Antigua and Barbuda' },
      { value: 'AR', label: 'Argentina' },
      { value: 'AM', label: 'Armenia' },
      { value: 'AW', label: 'Aruba' },
      { value: 'AU', label: 'Australia' },
      { value: 'AT', label: 'Austria' },
      { value: 'AZ', label: 'Azerbaijan' },
      { value: 'BS', label: 'Bahamas' },
      { value: 'BH', label: 'Bahrain' },
      { value: 'BD', label: 'Bangladesh' },
      { value: 'BB', label: 'Barbados' },
      { value: 'BY', label: 'Belarus' },
      { value: 'BE', label: 'Belgium' },
      { value: 'BZ', label: 'Belize' },
      { value: 'BJ', label: 'Benin' },
      { value: 'BM', label: 'Bermuda' },
      { value: 'BT', label: 'Bhutan' },
      { value: 'BO', label: 'Bolivia' },
      { value: 'BQ', label: 'Bonaire, Sint Eustatius and Saba' },
      { value: 'BA', label: 'Bosnia and Herzegovina' },
      { value: 'BW', label: 'Botswana' },
      { value: 'BR', label: 'Brazil' },
      { value: 'IO', label: 'British Indian Ocean Territory' },
      { value: 'BN', label: 'Brunei Darussalam' },
      { value: 'BG', label: 'Bulgaria' },
      { value: 'BF', label: 'Burkina Faso' },
      { value: 'BI', label: 'Burundi' },
      { value: 'KH', label: 'Cambodia' },
      { value: 'CM', label: 'Cameroon' },
      { value: 'CA', label: 'Canada' },
      { value: 'CV', label: 'Cape Verde' },
      { value: 'KY', label: 'Cayman Islands' },
      { value: 'CF', label: 'Central African Republic' },
      { value: 'TD', label: 'Chad' },
      { value: 'CL', label: 'Chile' },
      { value: 'CN', label: 'China' },
      { value: 'CX', label: 'Christmas Island' },
      { value: 'CC', label: 'Cocos (Keeling) Islands' },
      { value: 'CO', label: 'Colombia' },
      { value: 'KM', label: 'Comoros' },
      { value: 'CG', label: 'Congo' },
      { value: 'CD', label: 'Congo, The Democratic Republic of the' },
      { value: 'CK', label: 'Cook Islands' },
      { value: 'CR', label: 'Costa Rica' },
      { value: 'CI', label: "Côte d'Ivoire" },
      { value: 'HR', label: 'Croatia' },
      { value: 'CU', label: 'Cuba' },
      { value: 'CW', label: 'Curaçao' },
      { value: 'CY', label: 'Cyprus' },
      { value: 'CZ', label: 'Czech Republic' },
      { value: 'DK', label: 'Denmark' },
      { value: 'DJ', label: 'Djibouti' },
      { value: 'DM', label: 'Dominica' },
      { value: 'DO', label: 'Dominican Republic' },
      { value: 'EC', label: 'Ecuador' },
      { value: 'EG', label: 'Egypt' },
      { value: 'SV', label: 'El Salvador' },
      { value: 'GQ', label: 'Equatorial Guinea' },
      { value: 'ER', label: 'Eritrea' },
      { value: 'EE', label: 'Estonia' },
      { value: 'SZ', label: 'Eswatini' },
      { value: 'ET', label: 'Ethiopia' },
      { value: 'FK', label: 'Falkland Islands (Malvinas)' },
      { value: 'FO', label: 'Faroe Islands' },
      { value: 'FJ', label: 'Fiji' },
      { value: 'FI', label: 'Finland' },
      { value: 'FR', label: 'France' },
      { value: 'GF', label: 'French Guiana' },
      { value: 'PF', label: 'French Polynesia' },
      { value: 'TF', label: 'French Southern Territories' },
      { value: 'GA', label: 'Gabon' },
      { value: 'GM', label: 'Gambia' },
      { value: 'GE', label: 'Georgia' },
      { value: 'DE', label: 'Germany' },
      { value: 'GH', label: 'Ghana' },
      { value: 'GI', label: 'Gibraltar' },
      { value: 'GR', label: 'Greece' },
      { value: 'GL', label: 'Greenland' },
      { value: 'GD', label: 'Grenada' },
      { value: 'GP', label: 'Guadeloupe' },
      { value: 'GU', label: 'Guam' },
      { value: 'GT', label: 'Guatemala' },
      { value: 'GG', label: 'Guernsey' },
      { value: 'GN', label: 'Guinea' },
      { value: 'GW', label: 'Guinea-Bissau' },
      { value: 'GY', label: 'Guyana' },
      { value: 'HT', label: 'Haiti' },
      { value: 'HM', label: 'Heard Island and McDonald Islands' },
      { value: 'VA', label: 'Holy See (Vatican City State)' },
      { value: 'HN', label: 'Honduras' },
      { value: 'HK', label: 'Hong Kong' },
      { value: 'HU', label: 'Hungary' },
      { value: 'IS', label: 'Iceland' },
      { value: 'IN', label: 'India' },
      { value: 'ID', label: 'Indonesia' },
      { value: 'XZ', label: 'Installations in International Waters' },
      { value: 'IR', label: 'Iran, Islamic Republic of' },
      { value: 'IQ', label: 'Iraq' },
      { value: 'IE', label: 'Ireland' },
      { value: 'IM', label: 'Isle of Man' },
      { value: 'IL', label: 'Israel' },
      { value: 'IT', label: 'Italy' },
      { value: 'JM', label: 'Jamaica' },
      { value: 'JP', label: 'Japan' },
      { value: 'JE', label: 'Jersey' },
      { value: 'JO', label: 'Jordan' },
      { value: 'KZ', label: 'Kazakhstan' },
      { value: 'KE', label: 'Kenya' },
      { value: 'KI', label: 'Kiribati' },
      { value: 'KP', label: "Korea, Democratic People's Republic of" },
      { value: 'KR', label: 'Korea, Republic of' },
      { value: 'KW', label: 'Kuwait' },
      { value: 'KG', label: 'Kyrgyzstan' },
      { value: 'LA', label: "Lao People's Democratic Republic" },
      { value: 'LV', label: 'Latvia' },
      { value: 'LB', label: 'Lebanon' },
      { value: 'LS', label: 'Lesotho' },
      { value: 'LR', label: 'Liberia' },
      { value: 'LY', label: 'Libya' },
      { value: 'LI', label: 'Liechtenstein' },
      { value: 'LT', label: 'Lithuania' },
      { value: 'LU', label: 'Luxembourg' },
      { value: 'MO', label: 'Macao' },
      { value: 'MG', label: 'Madagascar' },
      { value: 'MW', label: 'Malawi' },
      { value: 'MY', label: 'Malaysia' },
      { value: 'MV', label: 'Maldives' },
      { value: 'ML', label: 'Mali' },
      { value: 'MT', label: 'Malta' },
      { value: 'MH', label: 'Marshall Islands' },
      { value: 'MQ', label: 'Martinique' },
      { value: 'MR', label: 'Mauritania' },
      { value: 'MU', label: 'Mauritius' },
      { value: 'YT', label: 'Mayotte' },
      { value: 'MX', label: 'Mexico' },
      { value: 'FM', label: 'Micronesia, Federated States of' },
      { value: 'MD', label: 'Moldova, Republic of' },
      { value: 'MC', label: 'Monaco' },
      { value: 'MN', label: 'Mongolia' },
      { value: 'ME', label: 'Montenegro' },
      { value: 'MS', label: 'Montserrat' },
      { value: 'MA', label: 'Morocco' },
      { value: 'MZ', label: 'Mozambique' },
      { value: 'MM', label: 'Myanmar' },
      { value: 'NA', label: 'Namibia' },
      { value: 'NR', label: 'Nauru' },
      { value: 'NP', label: 'Nepal' },
      { value: 'NL', label: 'Netherlands' },
      { value: 'NC', label: 'New Caledonia' },
      { value: 'NZ', label: 'New Zealand' },
      { value: 'NI', label: 'Nicaragua' },
      { value: 'NE', label: 'Niger' },
      { value: 'NG', label: 'Nigeria' },
      { value: 'NU', label: 'Niue' },
      { value: 'NF', label: 'Norfolk Island' },
      { value: 'MK', label: 'North Macedonia' },
      { value: 'MP', label: 'Northern Mariana Islands' },
      { value: 'NO', label: 'Norway' },
      { value: 'OM', label: 'Oman' },
      { value: 'PK', label: 'Pakistan' },
      { value: 'PW', label: 'Palau' },
      { value: 'PS', label: 'Palestine, State of' },
      { value: 'PA', label: 'Panama' },
      { value: 'PG', label: 'Papua New Guinea' },
      { value: 'PY', label: 'Paraguay' },
      { value: 'PE', label: 'Peru' },
      { value: 'PH', label: 'Philippines' },
      { value: 'PN', label: 'Pitcairn' },
      { value: 'PL', label: 'Poland' },
      { value: 'PT', label: 'Portugal' },
      { value: 'PR', label: 'Puerto Rico' },
      { value: 'QA', label: 'Qatar' },
      { value: 'RE', label: 'Reunion' },
      { value: 'RO', label: 'Romania' },
      { value: 'RU', label: 'Russian Federation' },
      { value: 'RW', label: 'Rwanda' },
      { value: 'BL', label: 'Saint Barthélemy' },
      { value: 'SH', label: 'Saint Helena, Ascension and Tristan Da Cunha' },
      { value: 'KN', label: 'Saint Kitts and Nevis' },
      { value: 'LC', label: 'Saint Lucia' },
      { value: 'MF', label: 'Saint Martin (French Part)' },
      { value: 'PM', label: 'Saint Pierre and Miquelon' },
      { value: 'VC', label: 'Saint Vincent and the Grenadines' },
      { value: 'WS', label: 'Samoa' },
      { value: 'SM', label: 'San Marino' },
      { value: 'ST', label: 'Sao Tome and Principe' },
      { value: 'SA', label: 'Saudi Arabia' },
      { value: 'SN', label: 'Senegal' },
      { value: 'RS', label: 'Serbia' },
      { value: 'SC', label: 'Seychelles' },
      { value: 'SL', label: 'Sierra Leone' },
      { value: 'SG', label: 'Singapore' },
      { value: 'SX', label: 'Sint Maarten (Dutch Part)' },
      { value: 'SK', label: 'Slovakia' },
      { value: 'SI', label: 'Slovenia' },
      { value: 'SB', label: 'Solomon Islands' },
      { value: 'SO', label: 'Somalia' },
      { value: 'ZA', label: 'South Africa' },
      { value: 'GS', label: 'South Georgia and the South Sandwich Islands' },
      { value: 'SS', label: 'South Sudan' },
      { value: 'ES', label: 'Spain' },
      { value: 'LK', label: 'Sri Lanka' },
      { value: 'SD', label: 'Sudan' },
      { value: 'SR', label: 'Suriname' },
      { value: 'SJ', label: 'Svalbard and Jan Mayen' },
      { value: 'SE', label: 'Sweden' },
      { value: 'CH', label: 'Switzerland' },
      { value: 'SY', label: 'Syrian Arab Republic' },
      { value: 'TW', label: 'Taiwan' },
      { value: 'TJ', label: 'Tajikistan' },
      { value: 'TZ', label: 'Tanzania, United Republic of' },
      { value: 'TH', label: 'Thailand' },
      { value: 'TL', label: 'Timor-Leste' },
      { value: 'TG', label: 'Togo' },
      { value: 'TK', label: 'Tokelau' },
      { value: 'TO', label: 'Tonga' },
      { value: 'TT', label: 'Trinidad and Tobago' },
      { value: 'TN', label: 'Tunisia' },
      { value: 'TR', label: 'Turkey' },
      { value: 'TM', label: 'Turkmenistan' },
      { value: 'TC', label: 'Turks and Caicos Islands' },
      { value: 'TV', label: 'Tuvalu' },
      { value: 'UG', label: 'Uganda' },
      { value: 'UA', label: 'Ukraine' },
      { value: 'AE', label: 'United Arab Emirates' },
      { value: 'GB', label: 'United Kingdom' },
      { value: 'US', label: 'United States' },
      { value: 'UM', label: 'United States Minor Outlying Islands' },
      { value: 'UY', label: 'Uruguay' },
      { value: 'UZ', label: 'Uzbekistan' },
      { value: 'VU', label: 'Vanuatu' },
      { value: 'VE', label: 'Venezuela' },
      { value: 'VN', label: 'Viet Nam' },
      { value: 'VG', label: 'Virgin Islands, British' },
      { value: 'VI', label: 'Virgin Islands, U.S.' },
      { value: 'WF', label: 'Wallis and Futuna' },
      { value: 'EH', label: 'Western Sahara' },
      { value: 'YE', label: 'Yemen' },
      { value: 'ZM', label: 'Zambia' },
      { value: 'ZW', label: 'Zimbabwe' }
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
