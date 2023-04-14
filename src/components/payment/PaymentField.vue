<template lang="pug">
div(class="field")
  template(v-if="isChange")
    svg-icon(iconName="page-close" iconWidth="10px"
            iconColor="gray-0" class="field__close pointer" @click="close()")
    span(class="text-H6 text-gray-2 mb-40") {{$t('NN0600')}}
  div(class="field-card")
    options(v-if="!isChange" class="mb-10"
            :options="countryData" v-model="userCountryUi")
    div(:class="{hidden: !useTappay}" class="field-card-tappay")
      div(id="card-number")
      div(id="card-date")
      div(id="card-ccv")
    div(:class="{hidden: useTappay}" class="field-card-stripe" id="stripe")
      svg-icon(iconName="loading" iconColor="gray-1")
    template(v-if="!isChange")
      div(v-if="PaidDate" class="field-card__info")
        span {{$t('NN0552', {date: PaidDate})}}
        span {{`$${plans[planSelected][periodUi].nextPaid - coupon.discount}`}}
      div(v-if="coupon.discount!==0" class="field-card__info text-green-1")
        span {{$t('NN0699')}}
        span {{`-$${coupon.discount}`}}
      div(class="field-card__info overline-LG")
        span {{$t('NN0553')}}
        span {{priceToday}}
  div(v-if="!isChange" class="field-invoice")
    div(class="text-H4 mb-25") {{$t('NN0554')}}
    div(v-for="inv in invoiceInput"
        :key="inv.key"
        class="field-invoice__input")
      input(:placeholder="inv.ph" :invalid="biv[inv.key]" v-model="bi[inv.key]")
      span(v-if="biv[inv.key]" class="text-red") {{inv.error}}
  btn(class="btn-LG mt-30 rounded" type="primary-lg"
      :disabled="disableSubmit" @click="submit()") {{submitText}}
</template>

<script lang="ts">
import Options from '@/components/global/Options.vue'
import paymentData from '@/utils/constantData'
import mappingUtils from '@/utils/mappingUtils'
import { notify } from '@kyvg/vue3-notification'
import { Stripe, StripeElements, StripePaymentElementOptions } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js/pure'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default defineComponent({
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
  emits: ['next'],
  data() {
    return {
      countryData: paymentData.countryList(),
      // Stripe
      stripePayReady: false,
      stripe: null as unknown as Stripe,
      stripeElement: null as unknown as StripeElements,
      // Tappay
      tappayPayReady: false
    }
  },
  watch: {
    userCountryUi() {
      this.getPrice(this.userCountryUi)
    }
  },
  computed: {
    ...mapGetters('payment', {
      PaidDate: 'getPaidDate'
    }),
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
      trialStatus: 'trialStatus',
      coupon: 'coupon'
    }),
    useTappay(): boolean {
      // When update credit card (isChange is true), use countryInfo instead of countryUi.
      return this.isChange ? this.userCountryInfo === 'tw'
        : this.userCountryUi === 'tw'
    },
    priceToday(): string {
      if (!this.PaidDate) return '$' + this.plans[this.planSelected][this.periodUi].nextPaid
      else if (this.userCountryUi === 'tw') return '$0'
      else return '$0.00'
    },
    submitText(): string {
      return (this.isLoading
        ? this.$t('NN0454')
        : this.isChange
          ? this.$tc('NN0133', 2)
          : this.trialStatus === 'not used'
            ? this.$t('NN0560')
            : this.$t('NN0561')) as string
    },
    invoiceReady(): boolean { // Check if input is empty
      for (const item of this.invoiceInput) {
        if (item.optional) continue
        if (!this.bi[item.key as string]) return false
      }
      return true
    },
    payReady(): boolean {
      return this.useTappay
        ? this.tappayPayReady && this.invoiceReady
        : this.stripePayReady && this.invoiceReady
    },
    disableSubmit(): boolean {
      return !this.payReady || this.isLoading
    },
    invoiceInput(): ReturnType<typeof paymentData.gerneral> {
      switch (this.userCountryUi) {
        case 'tw':
          return [...paymentData.gerneral(), ...paymentData.TWonly()]
        default:
          return paymentData.gerneral()
      }
    }
  },
  mounted() {
    this.tappayInit()
    this.stripeInit()
    this.getPrice(this.userCountryUi)
  },
  methods: {
    ...mapActions({
      tappayAdd: 'payment/tappayAdd',
      stripeAdd: 'payment/stripeAdd',
      tappayUpdate: 'payment/tappayUpdate',
      stripeUpdate: 'payment/stripeUpdate',
      checkBillingInfo: 'payment/checkBillingInfo',
      getPrice: 'payment/getPrice'
    }),
    ...mapMutations({
      setPrime: 'payment/SET_prime'
    }),
    tappayInit() {
      window.TPDirect.setupSDK(
        122890,
        'app_vCknZsetHXn07bficr2XQdp7o373nyvvxNoBEm6yIcqgQGFQA96WYtUTDu60',
        'production'
      )
      // @ts-expect-error: Type of card.setup is not correct, skip its type check.
      window.TPDirect.card.setup(paymentData.tappayConfig())
      window.TPDirect.card.onUpdate((update) => {
        this.tappayPayReady = update.canGetPrime
      })
    },
    async stripeInit() {
      await this.clientSecret // Wait for api promise
      this.stripe = await loadStripe('pk_live_51HPpbIJuHmbesNZIbXTLIiElWHqRqS9xLnCkoJ9LynKfQO2G9JIVpeEdogBdBU7aiqvXrTjjJQPUVVGQBdSxwmoc00bJcj9VG2', {
        locale: mappingUtils.mappingLocales(this.$i18n.locale) as 'zh-TW'// | 'ja-JP' | 'en-US'
      }) as Stripe
      this.stripeElement = this.stripe.elements({
        clientSecret: this.clientSecret,
        // todo: Floating will cause layout issue if user first choose TW and than choose other country in Chrome.
        // appearance: { labels: 'floating' },
        loader: 'always'
      })
      const stripePaymentElement = this.stripeElement.create(
        'payment',
        paymentData.stripeOption() as StripePaymentElementOptions
      )
      stripePaymentElement.mount('#stripe')
      stripePaymentElement.on('change', (event) => {
        this.stripePayReady = event.complete
      })
    },
    async checkInvoiceInput(): Promise<boolean> {
      for (const item of this.invoiceInput) { // Check invoice input validity
        if (item.error && await this.checkBillingInfo(item.key)) return false
      }
      return true
    },
    async tappaySubmit() {
      if (!await this.checkInvoiceInput()) return
      this.isLoading = true

      window.TPDirect.card.getPrime((result) => {
        return new Promise<void>((resolve) => {
          if (result.status !== 0) throw Error(result.msg)
          this.setPrime(result.card.prime)
          resolve()
        }).then(() => {
          return this.isChange ? this.tappayUpdate() : this.tappayAdd()
        }).then(({ data }) => {
          if (data.flag) throw Error(data.msg)
          this.close()
        }).catch(msg => {
          notify({ group: 'error', text: msg })
          this.isLoading = false
        })
      })
    },
    async stripeSubmit() {
      if (!await this.checkInvoiceInput()) return
      this.isLoading = true

      this.stripe.confirmSetup({
        elements: this.stripeElement,
        confirmParams: { payment_method_data: { billing_details: { address: { country: this.userCountryUi } } } },
        redirect: 'if_required'
      }).then((response) => {
        if (response.error) throw Error(response.error.message)
      }).then(() => {
        return this.isChange ? this.stripeUpdate() : this.stripeAdd()
      }).then(({ data }) => {
        if (data.flag) throw Error(data.msg)
        this.close()
      }).catch(msg => {
        notify({ group: 'error', text: msg })
        this.isLoading = false
      })
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
input {
  @include default-input;
}

.field {
  @include body-SM;
  display: flex;
  flex-direction: column;
  height: 100%; // Let button at the same position as popup payment step1
  color: setColor(gray-1);
  &__close {
    // Relaive to SettingsPayment.vue .sp-field
    position: absolute;
    top: 0px;
    right: 0px;
    padding: 10px;
  }
}

.field-card-tappay {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
  > div {
    height: 18px;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
    padding: 10px;
  }
  #card-number {
    grid-column: 1 / 3;
  }
}

.field-card-stripe {
  > svg {
    display: block;
    margin: auto;
  }
}

.field-card__info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.field-invoice {
  margin-top: 20px;
  &__input + &__input {
    margin-top: 8px;
  }
}

.hidden {
  display: none;
}
</style>
