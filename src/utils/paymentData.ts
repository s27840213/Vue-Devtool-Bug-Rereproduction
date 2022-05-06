import i18n from '@/i18n'
import VueI18n from 'vue-i18n'

interface BillingInfoInput {
  label: VueI18n.TranslateResult
  ph?: VueI18n.TranslateResult
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
      i18n.t('TMP0014'), i18n.t('TMP0015'), i18n.t('TMP0016'),
      i18n.t('TMP0017'), '-', true,
      i18n.t('TMP0018'), true, true,
      i18n.t('TMP0019'), true, true,
      i18n.t('TMP0020'), '1GB', '100GB',
      i18n.t('TMP0021'), true, true,
      i18n.t('TMP0022'), '-', true,
      i18n.t('TMP0023'), '-', true,
      i18n.t('TMP0024'), true, true,
      i18n.t('TMP0025'), true, true,
      i18n.t('TMP0026'), true, true
    ]
  }

  faqs() {
    return [
      { Q: i18n.t('TMP0028'), A: i18n.t('TMP0029') },
      { Q: i18n.t('TMP0030'), A: i18n.t('TMP0031') },
      { Q: i18n.t('TMP0032'), A: i18n.t('TMP0033') },
      { Q: i18n.t('TMP0034'), A: i18n.t('TMP0035') },
      { Q: i18n.t('TMP0036'), A: i18n.t('TMP0037') }
    ]
  }

  // For SettingsPayment billing info
  country():BillingInfoInput[] {
    return [{ label: 'country' }]
  }

  gerneral():BillingInfoInput[] {
    return [{
      label: i18n.tc('NN0173', 1) as string,
      ph: i18n.t('TMP0088') as string,
      key: 'email',
      error: 'Invalid email format.'
    }, {
      label: i18n.t('NN0172') as string,
      ph: i18n.t('TMP0089') as string,
      key: 'name'
    }]
  }

  TWonly():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0047') as string,
      ph: i18n.t('TMP0048') as string,
      key: 'phone',
      error: 'Invalid phone format.'
    }, {
      label: i18n.t('TMP0049') as string,
      ph: i18n.t('TMP0050') as string,
      key: 'GUI',
      error: 'Invalid GUI format.'
    }]
  }

  USonly():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0090') as string,
      ph: i18n.t('TMP0091') as string,
      key: 'company'
    }, {
      label: i18n.t('TMP0094', { number: 1 }) as string,
      ph: i18n.t('TMP0095') as string,
      key: 'address1'
    }, {
      label: i18n.t('TMP0094', { number: 2 }) as string,
      ph: i18n.t('TMP0096') as string,
      key: 'address2'
    }, {
      label: i18n.t('TMP0097') as string,
      ph: i18n.t('TMP0097') as string,
      key: 'city'
    }, {
      label: 'state & zip',
      key: 'zip',
      error: 'Invalid zip format.'
    }]
  }

  others():BillingInfoInput[] {
    return [{
      label: i18n.t('TMP0090') as string,
      ph: i18n.t('TMP0091') as string,
      key: 'company'
    }, {
      label: i18n.t('TMP0092') as string,
      ph: i18n.t('TMP0093') as string,
      key: 'address1'
    }]
  }
}

export default new PaymentData()
