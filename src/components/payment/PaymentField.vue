<template lang="pug">
  div(class="field")
    div(v-if="isChange" class="field__close")
      svg-icon(iconName="page-close" iconWidth="10px" iconColor="gray-0"
              class="pointer" @click.native="close()")
    span(v-if="isChange" class="field__title") {{$t('TMP0098')}}
    //- todo rearrange class name
    div(class="field-content")
      options(v-if="!isChange" class="mb-10"
              :options="countryData" v-model="userCountryUi")
      div(:class="{hidden: !useTappay}" class="field__tappay")
        div(class="field__tappay-card" id="card-number")
        div(class="field__tappay-date" id="card-date")
        div(class="field__tappay-ccv" id="card-ccv")
      div(:class="{hidden: useTappay}" id="stripe" class="stripe")
        svg-icon(iconName="loading" iconColor="gray-1")
      template(v-if="!isChange")
        div(v-if="paymentPaidDate" class="field-content__info")
          span {{$t('TMP0049', {date: paymentPaidDate})}}
          span {{'$'+plans[planSelected][periodUi].nextPaid}}
        div(class="field-content__info-today")
          span {{$t('TMP0050')}}
          span {{priceToday}}
    div(v-if="!isChange && useTappay" class="field-invoice")
      span(class="field-invoice__title") {{$t('TMP0051')}}
      div(v-for="inv in invoiceInput" class="field-invoice__input")
        input(:placeholder="inv.ph" :invalid="biv[inv.key]" v-model="bi[inv.key]")
        span(v-if="biv[inv.key]") {{inv.error}}
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
      invoiceInput: [...paymentData.gerneral(), ...paymentData.TWonly()],
      // Stripe
      stripePayReady: false,
      stripe: null as unknown as Stripe,
      stripeElement: null as unknown as StripeElements,
      // Tappay
      tappayPayReady: false,
      TPDirect: (window as any).TPDirect
    }
  },
  watch: {
    userCountryUi() {
      this.getPrice(this.userCountryUi)
    }
  },
  computed: {
    ...mapFields({
      userCountryUi: 'userCountryUi',
      bi: 'billingInfo',
      isLoading: 'isLoading'
    }),
    ...mapState('payment', {
      plans: 'plans',
      planSelected: 'planSelected',
      periodUi: 'periodUi',
      userCountryInfo: 'userCountryInfo',
      clientSecret: 'stripeClientSecret',
      biv: 'billingInfoInvalid',
      paymentPaidDate: 'paymentPaidDate',
      trialStatus: 'trialStatus'
    }),
    useTappay():boolean {
      return this.isChange ? this.userCountryInfo === 'tw'
        : this.userCountryUi === 'tw'
    },
    priceToday():string {
      if (!this.paymentPaidDate) return '$' + this.plans[this.planSelected][this.periodUi].nextPaid
      else if (this.userCountryUi === 'tw') return '$0'
      else return '$0.00'
    },
    submitText(): string {
      return (this.isLoading
        ? i18n.t('NN0454')
        : this.isChange
          ? i18n.t('NN0133')
          : this.trialStatus === 'not used'
            ? i18n.t('TMP0057')
            : i18n.t('TMP0058')) as string
    },
    invoiceReady():boolean { // Check if input is empty
      for (const item of this.invoiceInput) {
        if (item.optional) continue
        if (!this.bi[item.key as string]) return false
      }
      return true
    },
    payReady():boolean {
      return this.useTappay
        ? this.tappayPayReady && this.invoiceReady
        : this.stripePayReady
    }
  },
  mounted() {
    this.tappayInit()
    this.stripeInit()
  },
  methods: {
    ...mapActions({
      tappayAdd: 'payment/tappayAdd',
      stripeAddApi: 'payment/stripeAdd',
      tappayUpdate: 'payment/tappayUpdate',
      stripeUpdate: 'payment/stripeUpdate',
      checkBillingInfo: 'payment/checkBillingInfo',
      getPrice: 'payment/getPrice'
    }),
    ...mapMutations({
      setPrime: 'payment/SET_prime'
    }),
    tappayInit() {
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
        this.tappayPayReady = update.canGetPrime
      })
    },
    async stripeInit() {
      await this.clientSecret // Wait for api promise
      this.stripe = await loadStripe('pk_test_51HPpbIJuHmbesNZIuUI72j9lqXbbTTRJvlaYP8G9RB7VVsLvywU9MgQcxm2n0z6VigfQYa0NQ9yVeIfeOErnDzSp00rgpdMoAr') as Stripe
      this.stripeElement = this.stripe.elements({
        clientSecret: this.clientSecret,
        appearance: { labels: 'floating' }
      })
      const stripePaymentElement = this.stripeElement.create('payment', {
        fields: { billingDetails: { address: { country: 'never' } } }
      })
      stripePaymentElement.mount('#stripe')
      stripePaymentElement.on('change', (event) => {
        this.stripePayReady = event.complete
      })
    },
    async tappaySubmit() {
      for (const item of this.invoiceInput) { // Check invoice input validity
        if (item.error && await this.checkBillingInfo(item.key)) return
      }
      this.isLoading = true
      const callback = (result: any) => {
        return new Promise<void>((resolve) => {
          if (result.status !== 0) throw Error(result.msg)
          this.setPrime(result.card.prime)
          resolve()
        }).then(() => {
          return this.isChange ? this.tappayUpdate() : this.tappayAdd()
        }).then(() => {
          this.close()
        })
      }
      this.TPDirect.card.getPrime(callback)
    },
    stripeSubmit() {
      this.isLoading = true
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
        this.close()
      }).catch(msg => Vue.notify({ group: 'error', text: msg }))
    },
    submit() {
      this.useTappay ? this.tappaySubmit() : this.stripeSubmit()
    },
    close() {
      this.$emit('next')
    }
  }
})
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  // justify-content: space-between;
  position: relative;
  height: 100%;
  &__close {
    position: absolute;
    top: -7px;
    right: -47px;
  }
  &__title { // move to html?
    @include text-H6;
    color: setColor(gray-2);
    margin-bottom: 40px;
  }
  >button {
    @include btn-LG;
    margin-top: 42px;
  }
}

.field__tappay {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 12px;
  >div {
    height: 18px;
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
  height: 100%;
  &__info, &__info-today {
    @include body-SM;
    color: setColor(gray-1);
    display: flex;
    justify-content: space-between;
    margin: 5px 0;
  }
  &__info-today { @include overline-LG; }
}

.field-invoice {
  margin-top: 20px;
  &__title {
    @include text-H4;
    margin-bottom: 6px;
  }
  &__input {
    >input {
      @include body-SM;
      width: calc(100% - 22px);
      height: 18px;
      margin: 4px 0;
      padding: 10px;
      border: 1px solid setColor(gray-3);
      border-radius: 4px;
    }
    // move to html class?
    >span { color: setColor(red); }
  }
}

.hidden {
  display: none;
}
</style>
