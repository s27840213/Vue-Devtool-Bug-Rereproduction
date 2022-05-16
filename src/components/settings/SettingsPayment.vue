<template lang="pug">
  div(class="sp")
    span {{`status: ${status}`}}
    br
    span(class="text-gray-3 pointer"
      @click="toInitial()")  {{'goto Initial'}}
    br
    span(class="text-gray-3 pointer"
      @click="toAbort()")  {{'goto Abort'}}
    br
    span(class="text-gray-3 pointer"
      @click="toFail()")  {{'goto Fail'}}
    div(class="sp-plan")
      span(class="text-blue-1 body-MD") {{$t('TMP0081')}}
      svg-icon(v-if="isFreeIcon" iconName="free")
      svg-icon(v-else            iconName="pro" :iconColor="proIconColor")
      span(v-if="showDueDay")           {{$t('TMP0088', {date: myPaidDate})}}
      btn(v-if="canResume" class="rounded"
          type="primary-mid" @click.native="resume()")
        span                            {{$t('TMP0083')}}
      btn(v-if="canAdd" class="rounded"
          type="primary-lg" @click.native="buy()")
        span                            {{$t('TMP0082')}}
      span(v-if="isFail"
          class="text-red overline-LG") {{$t('TMP0121')}}
      template(v-if="showPlan")
        span                            {{$t('TMP0084', { period: isBundle ? $t('TMP0011') : $t('TMP0010') })}}
        span(                     v-html="$t('TMP0085', { price: myPrice, date: myPaidDate  })")
      span(v-if="canSwitch" class="text-blue-1 pointer"
          @click="switchPeriod()")      {{$t('TMP0086', { period: isBundle ? $t('TMP0010') : $t('TMP0011')})}}
      span(v-if="canCancel" class="text-gray-3 pointer"
          @click="cancelSub()")         {{$t('TMP0087')}}
    div(v-if="showUsage" class="sp-usage")
      span(class="text-blue-1 mt-30")   {{$t('TMP0089')}}
      span(                       v-html="$t('TMP0090', { amount: usage.bgrmRemain, date: myPaidDate })")
      span(class="text-blue-1")         {{$t('TMP0092')}}
      div(class="sp-usage-disk")
        div(class="sp-usage-disk-total")
          div(class="sp-usage-disk-used" :style="diskPercent")
        span {{`${usage.diskUsed}/${usage.diskTotal}`}}
      span(class="body-XS")             {{$t('TMP0093')}}
    hr(v-if="card.status !== 'none'")
    div(v-if="card.status !== 'none'" class="sp-card")
      span(class="text-blue-1")         {{$t('TMP0094')}}
      card-info(:card="card" :trash="isCancelingPro")
      span(v-if="isFail"
        class="text-red overline-LG")   {{$t('TMP0121')}}
      span(v-if="canUpdateCard" class="text-blue-1 body-SM"
        @click="openCardPopup()")       {{$t('TMP0096')}}
    hr
    div(v-if="showBillingInfo" class="sp-info")
      span(class="text-blue-1 body-MD") {{$t('TMP0097')}}
      //- switch(input.label)
      template(v-for="input in billingInfoInput")
        //- case country
        options(v-if="input.label === 'country'" class="my-10"
                :options="countryData" v-model="userCountryInfo")
        //- case state & zip
        div(v-else-if="input.label === 'state & zip'" class="sp-info__half")
          span
          label(for="zip") {{$t('TMP0109')}}
          options(:options="stateData"
                  v-model="bi.state" :ph="$t('TMP0108')")
          input(id="zip" v-model="bi.zip" :invalid="biv.zip"
                :placeholder="$t('TMP0109')")
          span
          span(v-if="biv.zip" class="sp-info__invalid") {{'zip error'}}
        //- defualt
        template(v-else)
          label(:for="input.key") {{input.label}}
          input(:id="input.key" v-model="bi[input.key]"
                :placeholder="input.ph" :invalid="biv[input.key]")
          span(v-if="biv[input.key]" class="sp-info__invalid") {{input.error}}
      btn(type="primary-sm" @click.native="updateBillingInfo()"
          :disabled="!billingInfoCheck") {{$t('NN0176')}}
    div(v-if="showCardPopup" class="popup-window" )
      div(class="sp-field" v-click-outside="closeCardPopup")
        payment-field(isChange @next="closeCardPopup")
    div(v-if="showPaymentPopup" class="popup-window")
      popup-payment(:initView="paymentView" @close="closePaymentPopup()")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import vClickOutside from 'v-click-outside'
import Options from '@/components/global/Options.vue'
import PaymentField from '@/components/payment/PaymentField.vue'
import PopupPayment from '@/components/popup/PopupPayment.vue'
import CardInfo from '@/components/payment/CardInfo.vue'
import paymentData from '@/utils/paymentData'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default Vue.extend({
  name: 'SettingsPayment',
  components: {
    Options,
    PaymentField,
    PopupPayment,
    CardInfo
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      countryData: paymentData.countryList(),
      stateData: paymentData.usState(),
      showCardPopup: false,
      showPaymentPopup: false,
      paymentView: ''
    }
  },
  watch: {
    userCountryInfo(newVal, oldVal) {
      if (newVal === 'tw' && oldVal !== 'tw' && oldVal !== '') {
        this.$nextTick(() => {
          this.userCountryInfo = oldVal
          Vue.notify({ group: 'error', text: '如要取消開立統編，請先取消訂閱後選擇台灣再次訂閱。' })
        })
      }
    }
  },
  computed: {
    ...mapGetters({
      isBundle: 'payment/getIsBundle'
    }),
    ...mapFields({
      userCountryInfo: 'userCountryInfo',
      usage: 'usage',
      bi: 'billingInfo',
      biv: 'billingInfoInvalid'
    }),
    ...mapState('payment', {
      status: 'status',
      isPro: 'isPro',
      card: 'cardInfo',
      isCancelingPro: 'isCancelingPro',
      myPaidDate: 'myPaidDate',
      myPrice: 'myPrice'
    }),
    isFreeIcon():boolean { return !this.isPro && this.isCancelingPro },
    proIconColor():string { return this.status === 'Fail' ? 'gray-3' : 'blue-1' },
    isFail():boolean { return this.status === 'Fail' },
    showDueDay():boolean { return ['Deleted', 'Canceled'].includes(this.status) },
    showPlan():boolean { return ['Fail', 'Subscribed'].includes(this.status) },
    showUsage():boolean { return ['Fail', 'Subscribed', 'Deleted', 'Canceled'].includes(this.status) },
    showBillingInfo():boolean { return ['Fail', 'Leave', 'Abort', 'Subscribed', 'Deleted', 'Canceled'].includes(this.status) },
    canAdd():boolean { return this.status === 'Initial' },
    canResume():boolean { return ['Abort', 'Deleted', 'Canceled'].includes(this.status) },
    canSwitch():boolean { return this.status === 'Subscribed' },
    canCancel():boolean { return ['Fail', 'Subscribed'].includes(this.status) },
    canUpdateCard():boolean { return ['Fail', 'Subscribed', 'Canceled'].includes(this.status) },
    diskPercent():Record<string, string> {
      return { width: `${this.usage.diskUsed / this.usage.diskTotal * 200}px` }
    },
    billingInfoInput():ReturnType<typeof paymentData.gerneral> {
      switch (this.userCountryInfo) {
        case 'tw':
          return [...paymentData.gerneral(), ...paymentData.TWonly()]
        case 'us':
          return [...paymentData.country(), ...paymentData.gerneral(), ...paymentData.USonly()]
        default:
          return [...paymentData.country(), ...paymentData.gerneral(), ...paymentData.others()]
      }
    },
    billingInfoCheck():boolean { // Check if input is empty
      for (const item of this.billingInfoInput) {
        if (item.optional) continue
        switch (item.key) {
          case 'country':
            if (!this.userCountryInfo) return false
            break
          case 'state & zip':
            if (!this.bi.zip || !this.bi.state) return false
            break
          default:
            if (!this.bi[item.key as string]) return false
            break
        }
      }
      return true
    }
  },
  async mounted() {
    await this.getBillingInfo()
    this.getPrice()
  },
  methods: {
    ...mapActions({
      init: 'payment/init',
      getBillingInfo: 'payment/getBillingInfo',
      getPrice: 'payment/getPrice',
      updateBillingInfoApi: 'payment/updateBillingInfo',
      checkBillingInfo: 'payment/checkBillingInfo',
      resumeApi: 'payment/resume',
      toAbort: 'payment/toAbort',
      toInitial: 'payment/toInitial',
      toFail: 'payment/toFail'
    }),
    async updateBillingInfo() {
      for (const item of this.billingInfoInput) {
        if (item.error && await this.checkBillingInfo(item.key)) return
      }
      this.updateBillingInfoApi()
    },
    resume() {
      if (this.card.status !== 'none') this.resumeApi()
      else this.buy()
    },
    openCardPopup() {
      this.init()
      this.showCardPopup = true
    },
    closeCardPopup() { this.showCardPopup = false },
    closePaymentPopup() { this.showPaymentPopup = false },
    buy() {
      this.paymentView = 'step1'
      this.showPaymentPopup = true
    },
    switchPeriod() {
      this.paymentView = 'switch1'
      this.showPaymentPopup = true
    },
    cancelSub() {
      this.paymentView = 'cancel1'
      this.showPaymentPopup = true
    }
  }
})
</script>

<style lang="scss" scoped>
.sp {
  padding: 60px 13% 20px 13%;
  &-plan, &-usage, &-card, &-info, >hr { margin: 0 0 30px 0; }
  &-plan, &-usage, &-card, &-info {
    @include body-MD;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  &-plan, &-info { @include body-SM; }
  &-plan, &-usage {
    >span, >button, >svg { margin: 1px 0; }
  }
  >hr {
    width: 100%;
    border: 0.5px solid setColor(gray-4);
  }
}

.sp-plan {
  >button { @include btn-LG; }
}

.sp-usage-disk {
  display: flex;
  align-items: center;
  &-total, &-used { height: 10px; }
  &-total {
    margin-right: 5px;
    width: 200px;
    border: 1px solid setColor(blue-1);
  }
  &-used {
    background-color: setColor(blue-1);
  }
}

.sp-card {
  display: grid;
  grid-auto-flow: row;
  text-align: left;
  row-gap: 20px;
}

.sp-info {
  width: 350px;
  label { color: setColor(gray-3); }
  input {
    width: 330px;
    height: 18px;
    margin: 10px 0;
    padding: 10px;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
    color: setColor(gray-2);
    &:focus { border-color: setColor(blue-1); }
    &[invalid="true"] { border-color: red; }
  }
  &__invalid {
    color: setColor(red);
  }
  &__half {
    display: grid;
    grid-template-columns: 170px 170px;
    column-gap: 10px;
    text-align: left;
    >select, >input { margin: 10px 0; }
    >input { width: 150px; }
  }
  >button { margin: 10px 0 0 auto; }
}

.sp-field{
  width: 320px;
  height: 240px;
  padding: 20px 60px 40px 60px;
  background-color: white;
}
</style>
