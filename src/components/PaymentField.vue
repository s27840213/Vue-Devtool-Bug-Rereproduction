<template lang="pug">
  div(class="field")
    span(class="field__title") {{isChange ? $t('TMP0088') : ''}}
    div(class="field-content")
      options(v-if="!isChange" class="mb-10"
              :options="countryData" v-model="userCountryUi")
      div(:class="{hidden: !useTappay}" class="field__tappay")
        div(class="field__tappay-card" id="card-number")
        div(class="field__tappay-date" id="card-date")
        div(class="field__tappay-ccv" id="card-ccv")
      div(:class="{hidden: useTappay}" id="stripe" class="stripe")
        svg-icon(iconName="loading" iconColor="gray-1")
      div(v-if="!isChange" class="field-content__info")
        span {{$t('TMP0046', {date: nextPaidDate})}}
        span {{plans[planSelected][periodUi].nextPaid}}
      div(v-if="!isChange" class="field-content__info-today")
        span {{$t('TMP0047')}}
        span {{'USD 0.00'}}
    btn(class="rounded" type="primary-lg"
        :disabled="!payReady" @click.native="submit()") {{submitText}}
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapActions, mapMutations, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import Options from '@/components/global/Options.vue'
import { Stripe, StripeElements } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js/pure'
import paymentData from '@/utils/paymentData'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default Vue.extend({
  name: 'PaymentField',
  props: {
    isChange: { // Is change credit card
      type: Boolean,
      default: false
    }
  },
  components: {
    Options
  },
  data() {
    return {
      countryData: paymentData.countryList(),
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
    userCountryUi() {
      if (this.useTappay) {
        this.tappayInit()
      } else {
        this.stripeInit()
        this.submit = this.stripeSubmit
      }
      this.getPrice(this.userCountryUi)
    }
  },
  computed: {
    ...mapFields({
      userCountryUi: 'userCountryUi',
      nextPaidDate: 'nextPaidDate'
    }),
    ...mapState('payment', {
      plans: 'plans',
      planSelected: 'planSelected',
      periodUi: 'periodUi',
      userCountryInfo: 'userCountryInfo'
    }),
    useTappay():boolean {
      return this.isChange ? this.userCountryInfo === 'TW'
        : this.userCountryUi === 'TW'
    },
    submitText(): string {
      return (this.isChange
        ? i18n.t('NN0133')
        : this.useTappay
          ? i18n.t('TMP0043')
          : i18n.t('TMP0053')) as string
    }
  },
  mounted() {
    if (this.useTappay) {
      this.tappayInit()
    } else {
      this.stripeInit()
    }
  },
  methods: {
    ...mapActions({
      stripeInitApi: 'payment/stripeInit',
      stripeAddApi: 'payment/stripeAdd',
      tappayUpdate: 'payment/tappayUpdate',
      stripeUpdate: 'payment/stripeUpdate',
      getPrice: 'payment/getPrice'
    }),
    ...mapMutations({
      setPrime: 'payment/SET_prime'
    }),
    async stripeInit() {
      if (this.stripe) return // Prevent load stripe twice

      this.payReady = false
      this.submit = this.stripeSubmit
      const clientSecret = await this.stripeInitApi()
      this.stripe = await loadStripe('pk_test_51HPpbIJuHmbesNZIuUI72j9lqXbbTTRJvlaYP8G9RB7VVsLvywU9MgQcxm2n0z6VigfQYa0NQ9yVeIfeOErnDzSp00rgpdMoAr') as Stripe

      this.stripeElement = this.stripe.elements({
        clientSecret: clientSecret,
        appearance: { labels: 'floating' }
      })
      const stripePaymentElement = this.stripeElement.create('payment', {
        fields: { billingDetails: { address: { country: 'never' } } }
      })
      stripePaymentElement.mount('#stripe')
      stripePaymentElement.on('change', (event) => {
        this.payReady = event.complete
      })
    },
    stripeSubmit() {
      this.stripe.confirmSetup({
        elements: this.stripeElement,
        confirmParams: { payment_method_data: { billing_details: { address: { country: this.userCountryUi } } } },
        redirect: 'if_required'
      }).then((response) => {
        if (response.error) throw Error(response.error.message)
      }).then(() => {
        return this.isChange ? this.stripeUpdate() : this.stripeAddApi()
      }).then(({ data }) => {
        if (data.flag) throw Error(data.msg)
        Vue.notify({ group: 'copy', text: 'Success' })
        this.$emit('next')
      }).catch(msg => Vue.notify({ group: 'error', text: msg }))
    },
    tappayInit() {
      this.payReady = false
      this.submit = this.tappaySubmit
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
    },
    tappaySubmit() {
      this.TPDirect.card.getPrime((result: any) => {
        if (result.status !== 0) {
          Vue.notify({ group: 'error', text: result.msg })
          return
        }
        this.setPrime(result.card.prime)
        if (this.isChange) this.tappayUpdate()
        this.$emit('next')
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

.stripe {
  display: flex;
  justify-content: center;
}

.field-content {
  &__info, &__info-today {
    @include body-SM;
    color: setColor(gray-1);
    display: flex;
    justify-content: space-between;
  }
  &__info-today { @include overline-LG; }
}

.hidden {
  display: none;
}
</style>
