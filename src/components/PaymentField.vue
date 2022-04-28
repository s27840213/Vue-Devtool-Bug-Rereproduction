<template lang="pug">
  div(class="field")
    span(class="field__title") {{isChange ? $t('TMP0081') : ''}}
    div(class="field-content")
      //- dropdown(v-if="!isChange" class="mb-20" :options="countryData"
      //-         @select="option => setCountry(option)")
      //-   span(class="country-label") {{userCountry.label}}
      options(v-if="!isChange" class="mb-20" :options="countryData" v-model="userCountry")
      span {{userCountry}}
      div(:class="{hidden: !isTW}" class="field__tappay")
        div(class="field__tappay-card" id="card-number")
        div(class="field__tappay-date" id="card-date")
        div(class="field__tappay-ccv" id="card-ccv")
      div(:class="{hidden: isTW}" id="stripe")
    btn(class="rounded" type="primary-lg"
        :disabled="!payReady" @click.native="submit()") {{submitText}}
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapGetters, mapMutations } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import Options from '@/components/global/Options.vue'
import { Stripe, StripeElements } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js/pure'
import countryData from '@/assets/json/countries.json'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default Vue.extend({
  name: 'PaymentField',
  props: {
    isChange: {
      type: Boolean,
      default: false
    }
  },
  components: {
    Options
  },
  data() {
    return {
      countryData,
      payReady: false,
      submit: null as unknown as () => void,
      // Stripe
      stripe: null as unknown as Stripe,
      stripeElement: null as unknown as StripeElements,
      // Tappay
      TPDirect: (window as any).TPDirect
    }
  },
  watch: {
    userCountry() {
      if (!this.isTW) {
        this.stripeInit()
      } else {
        this.submit = this.tappaySubmit
      }
    }
  },
  computed: {
    ...mapGetters({
      // userCountry: 'payment/getUserCountry',
      isTW: 'payment/isTW'
    }),
    ...mapFields({
      userCountry: 'userCountry'
    }),
    submitText(): string {
      return (this.isTW ? i18n.t('TMP0041') : i18n.t('TMP0047')) as string
    }
  },
  mounted() {
    switch (i18n.locale) {
      case 'tw':
        this.userCountry = 'TW'
        break
      case 'jp':
        this.userCountry = 'JP'
        break
      case 'us':
        this.userCountry = 'US'
        break
    }
    this.tappayInit()
  },
  methods: {
    ...mapMutations({
      // setUserCountry: 'payment/SET_userCountry',
      setPrime: 'payment/SET_prime'
    }),
    // setCountry(option: Record<string, string>) {
    //   this.setUserCountry(option)
    // },
    async stripeInit() {
      if (this.stripe) return

      this.payReady = false
      this.stripe = await loadStripe('pk_test_51HPpbIJuHmbesNZIuUI72j9lqXbbTTRJvlaYP8G9RB7VVsLvywU9MgQcxm2n0z6VigfQYa0NQ9yVeIfeOErnDzSp00rgpdMoAr') as Stripe
      // payment api init client sectet
      this.stripeElement = this.stripe.elements({
        clientSecret: 'seti_1KppzxJuHmbesNZItzzNJy9G_secret_LWtnjxN1FqK7D0Yh5n8zIWDXbPcJuxf',
        appearance: { labels: 'floating' }
      })
      const stripePaymentElement = this.stripeElement.create('payment', {
        fields: { billingDetails: { address: { country: 'never' } } }
      })
      stripePaymentElement.mount('#stripe')
      stripePaymentElement.on('change', (event) => {
        this.payReady = event.complete
      })
      this.submit = this.stripeSubmit
    },
    stripeSubmit() {
      console.log('stripe submit')
      // this.stripe.confirmSetup({
      //   elements: this.stripeElement,
      //   confirmParams: { payment_method_data: { billing_details: { address: { country: this.userCountry.value } } } },
      //   redirect: 'if_required'
      // }).then((result) => {
      //   console.log('stripe res', result)
      //   if (result.error) {
      //     Vue.notify({ group: 'error', text: result.error.code })
      //   } else {
      //     this.$emit('paid')
      //     Vue.notify({ group: 'copy', text: result.setupIntent.status })
      //   }
      // })
      this.$emit('paid')
    },
    tappayInit() {
      this.payReady = false
      this.TPDirect.setupSDK(122890, 'app_vCknZsetHXn07bficr2XQdp7o373nyvvxNoBEm6yIcqgQGFQA96WYtUTDu60', 'sandbox')

      this.TPDirect.card.setup({
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
      })

      this.TPDirect.card.onUpdate((update: any) => {
        this.payReady = update.canGetPrime
      })
      this.submit = this.tappaySubmit
    },
    tappaySubmit() {
      this.TPDirect.card.getPrime((result: any) => {
        if (result.status !== 0) {
          Vue.notify({ group: 'error', text: result.msg }) // todo throw exception
          return
        }

        this.setPrime(result.card.prime)
        this.$emit('paid')
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  &__title { // move to html?
    @include text-H6;
    color: setColor(gray-2);
    // margin-bottom: 50px;
  }
  >button {
    @include btn-LG;
    // width: 100%;
    // margin-top: auto;
  }
}

.field__tappay {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 12px;
  >div {
    height: 45px;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
    padding: 10px;
  }
  &-card { grid-column: 1 / 3; }
}

.hidden {
  display: none;
}
</style>
