<template lang="pug">
  div(class="top")
    //- todo v-header-border
    nu-header()
    div(class="payment")
      form(class="payment-input"
          @submit.prevent="submit")
        div(class="payment-input-block") 信用卡資訊
          div(class="payment-input-block-field")
            label(for="card-number") 信用卡號*
            div(id="card-number")
          div(class="payment-input-block-field")
            label(for="card-expiration-date") 信用卡有效年月*
            div(id="card-expiration-date")
          div(class="payment-input-block-field")
            label(for="card-ccv") 信用卡安全碼*
            div(id="card-ccv")
        div(class="payment-input-block") 個人資料
          div(class="payment-input-block-field")
            label(for="name") 姓名或公司名稱*
            input(id="name" required
                  v-model="userData.name"
                  placeholder="王大明 / 大明股份有限公司")
          div(class="payment-input-block-field")
            label(for="phone") 電話號碼*
            input(id="phone" required type="tel"
                  v-model="userData.phone_number"
                  placeholder="09xxxxxxxx")
          div(class="payment-input-block-field")
            label(for="email") e-mail*
            input(id="email" required type="email"
                  v-model="userData.email"
                  placeholder="example@vivipic.com")
          div(class="payment-input-block-field")
            label(for="country") 國家*
            dropdown(id="country" required :options="country"
                    @select="option => setCountry(option)")
              span(class="country-label") {{userCountryName}}
        btn(class="rounded" type="primary-mid"
            :disabled="!sendReady") 送出
      div(class="payment-result") 結果
        div(class="payment-result__msg") {{showPrime}}
        hr
        div(class="payment-result__msg") {{showPayment}}
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import payment from '@/apis/payment'
import NuHeader from '@/components/NuHeader.vue'
import countryData from '@/assets/json/countries.json'

export default Vue.extend({
  name: 'Payment',
  components: {
    NuHeader
  },
  data() {
    return {
      isLoading: false,
      primeReady: false,
      prime: {}, // todelete
      payment: {}, // todelete
      userData: {
        name: '',
        phone_number: '',
        email: '',
        country: ''
        // company: '',
        // address: '',
        // invoice: ''
      },
      userCountryName: '',
      country: countryData,
      TPDirect: (window as any).TPDirect
    }
  },
  watch: {
  },
  mounted() {
    switch (i18n.locale) {
      case 'tw':
        this.userData.country = 'TW'; this.userCountryName = 'Taiwan'
        break
      case 'jp':
        this.userData.country = 'JP'; this.userCountryName = 'Japan'
        break
      case 'us':
        this.userData.country = 'US'; this.userCountryName = 'United States'
        break
    }
    this.TPDirect.setupSDK(122890, 'app_vCknZsetHXn07bficr2XQdp7o373nyvvxNoBEm6yIcqgQGFQA96WYtUTDu60', 'sandbox')

    const fields = {
      number: {
        element: '#card-number',
        placeholder: '**** **** **** ****'
      },
      expirationDate: {
        element: '#card-expiration-date',
        placeholder: 'MM / YY'
      },
      ccv: {
        element: '#card-ccv',
        placeholder: 'ccv'
      }
    }

    this.TPDirect.card.setup({
      fields: fields,
      styles: {
        input: {
          color: 'gray',
          'font-size': '28px'
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
    })

    this.TPDirect.card.onUpdate((update: any) => {
      this.primeReady = update.canGetPrime

      // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unknown']
      if (update.cardType === 'visa') {
        // Handle card type visa.
      }

      // number fields is error
      if (update.status.number === 2) {
        // setNumberFormGroupToError()
      } else if (update.status.number === 0) {
        // setNumberFormGroupToSuccess()
      } else {
        // setNumberFormGroupToNormal()
      }

      if (update.status.expiry === 2) {
        // setNumberFormGroupToError()
      } else if (update.status.expiry === 0) {
        // setNumberFormGroupToSuccess()
      } else {
        // setNumberFormGroupToNormal()
      }

      if (update.status.ccv === 2) {
        // setNumberFormGroupToError()
      } else if (update.status.ccv === 0) {
        // setNumberFormGroupToSuccess()
      } else {
        // setNumberFormGroupToNormal()
      }
    })
  },
  computed: {
    showPrime():string { // todelete
      return Object.entries(this.prime).map(this.recursivePrint).join('\n')
    },
    showPayment():string { // todelete
      return Object.entries(this.payment).map(this.recursivePrint).join('\n')
    },
    sendReady():boolean {
      return this.primeReady && Object.values(this.userData).every(i => i !== '')
    }
  },
  methods: {
    recursivePrint(item: [string, unknown], index: number, array: [string, unknown][], prefix = ''):string { // todelete
      if (typeof item[1] === 'object') {
        return Object.entries(item[1] as any).map((v, i, a) =>
          this.recursivePrint(v, i, a, `${prefix}${item[0]}.`)).join('\n')
      }
      return `${prefix}${item.join(': ')}`
    },
    setCountry(option: Record<string, string>) {
      this.userData.country = option.value
      this.userCountryName = option.label
    },
    isLegalGUI(GUI :string) { // Government Uniform Invoice, 統編
      const weight = [1, 2, 1, 2, 1, 2, 4, 1]
      if (GUI.length !== 8) {
        return false
      }

      const GUIsum = GUI.split('').map((item, index) => {
        return parseInt(item) * weight[index] // Multipy by weight each
      }).map((item) => {
        return (item / 10 >> 0) + item % 10 // Sum of tens and units digit
      }).reduce((sum, cur) => {
        return sum + cur // Sum of all
      })

      return GUI[6] === '7' // Check if divisible by 5
        ? GUIsum % 5 === 0 || (GUIsum + 1) % 5 === 0
        : GUIsum % 5 === 0
    },
    submit() {
      this.isLoading = true
      this.prime = this.payment = ['交易中...']

      this.TPDirect.card.getPrime((result: any) => {
        if (result.status !== 0) {
          this.prime = this.payment = [result.msg]
          this.isLoading = false
          Vue.notify({ group: 'error', text: result.msg }) // todo throw exception
          return
        }

        this.prime = result
        payment.pay({
          type: 'tappay',
          prime: result.card.prime,
          card_info: JSON.stringify(this.userData)
        }).then((response) => {
          this.payment = response.data
          this.isLoading = false
          if (response.data.flag === 1) {
            Vue.notify({ group: 'error', text: response.data.msg })
          } else {
            Vue.notify({ group: 'copy', text: 'Success' })
          }
        })
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.top {
  height: calc(100% - #{$header-height});
}

.payment {
  @include text-H4;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: scroll;
}

.payment-input {
  display: flex;
  flex-direction: column;
  width: 80%;
  margin: 10px auto;
  &-block {
    display: flex;
    flex-direction: column;
    margin: 10px 0;
    &-field {
      display: flex;
      margin: 10px 0;
      label {
        display: flex;
        align-items: center;
        width: 200px;
      }
      div, input {
        @include text-H5;
        border: 1px black solid;
        border-radius: 4px;
        height: 50px;
        width: 700px;
      }
    }
  }
  button {
    margin: auto;
    height: 50px;
  }
}

.payment-result {
  display: flex;
  flex-direction: column;
  width: 80%;
  margin: auto;
  &__msg {
    white-space: pre;
    text-align: left;
  }
  hr {
    width: 200px;
  }
}
</style>
