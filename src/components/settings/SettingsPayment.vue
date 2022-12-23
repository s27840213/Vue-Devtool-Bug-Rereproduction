<template lang="pug">
div(class="sp")
  div(class="sp-plan")
    span(class="text-blue-1 body-MD") {{$t('NN0586')}}
    svg-icon(v-if="isProIcon" iconName="pro" :iconColor="proIconColor")
    svg-icon(v-else           iconName="free")
    span(v-if="showDueDay")           {{$t('NN0593', {date: myPaidDate})}}
    btn(v-if="canResume" class="rounded" type="primary-mid" @click="resume()")
      span                            {{$t('NN0588')}}
    btn(v-if="canAdd" class="rounded" type="primary-lg" @click="buy()")
      span                            {{$t('NN0587')}}
    span(v-if="isFail"
        class="text-red overline-LG") {{$t('NN0626')}}
    template(v-if="showPlan")
      span                            {{$t('NN0589', { period: isBundle ? $t('NN0515') : $t('NN0514') })}}
      span(                     v-html="$t('NN0590', { price: myPrice, date: myPaidDate  })")
    span(v-if="canSwitch" class="text-blue-1 pointer"
        @click="switchPeriod()")      {{isBundle ? $t('NN0591') : $t('NN0654')}}
    span(v-if="canCancel" class="text-gray-3 pointer"
        @click="cancelSub()")         {{$t('NN0592')}}
  div(v-if="showUsage" class="sp-usage")
    span(class="text-blue-1 mt-30")   {{$t('NN0594')}}
    span(                       v-html="$t('NN0595', { amount: usage.bgrmRemain, date: myPaidDate })")
    span(class="text-blue-1")         {{$t('NN0596')}}
    div(class="sp-usage-disk")
      div(class="sp-usage-disk-total")
        div(class="sp-usage-disk-used" :style="diskPercent")
      span {{`${diskUsedUi}/${usage.diskTotal} GB`}}
    span(class="body-XS")             {{$t('NN0597')}}
  hr(v-if="card.status !== 'none'")
  div(v-if="card.status !== 'none'" class="sp-card")
    span(class="text-blue-1")         {{$t('NN0598')}}
    card-info(:card="card" :canDelete="isCancelingPro")
    span(v-if="isFail"
      class="text-red overline-LG")   {{$t('NN0626')}}
    span(v-if="canUpdateCard" class="text-blue-1 body-SM pointer"
      @click="openCardPopup()")       {{$t('NN0600')}}
  hr
  i18n-t(v-if="isErrorStatus" class="sp-error" keypath="NN0656" tag="div")
    template(#contactus)
      a(class="text-blue-1 pointer" :href="contactUsUrl") {{$t('NN0642')}}
    template(#status)
      span {{status}}
  div(v-if="showBillingInfo" class="sp-info")
    span(class="text-blue-1 body-MD") {{$t('NN0601')}}
    //- switch(input.label)
    template(v-for="input in billingInfoInput")
      //- case country
      options(v-if="input.label === 'country'" :options="countryData"
              :value="userCountryInfo" @input="setUserCountryInfo")
      //- case state & zip
      div(v-else-if="input.label === 'state & zip'" class="sp-info__half")
        span
        label(for="zip") {{$t('NN0613')}}
        options(:options="stateData" v-model="bi.state" :ph="$t('NN0612')")
        input(id="zip" v-model="bi.zip" :invalid="biv.zip"
              :placeholder="$t('NN0613')")
        span
        span(v-if="biv.zip" class="text-red") {{input.error}}
      //- defualt
      template(v-else)
        label(:for="input.key") {{input.label}}
        input(:id="input.key" v-model="bi[input.key]"
              :placeholder="input.ph" :invalid="biv[input.key]")
        span(v-if="biv[input.key]" class="text-red") {{input.error}}
    btn(type="primary-mid" @click="updateBillingInfo()"
        :disabled="!billingInfoCheck") {{$t('NN0176')}}
  div(v-if="showCardPopup" class="popup-window")
    div(class="sp-field" v-click-outside="closeCardPopup")
      payment-field(isChange @next="closeCardPopup")
  spinner(v-if="isLoading" class="sp-rocket")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import vClickOutside from 'click-outside-vue3'
import Options from '@/components/global/Options.vue'
import PaymentField from '@/components/payment/PaymentField.vue'
import CardInfo from '@/components/payment/CardInfo.vue'
import paymentUtils from '@/utils/paymentUtils'
import paymentData from '@/utils/constantData'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default defineComponent({
  emits: [],
  name: 'SettingsPayment',
  components: {
    Options,
    PaymentField,
    CardInfo
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      countryData: paymentData.countryList(),
      stateData: paymentData.usState(),
      showCardPopup: false
    }
  },
  computed: {
    ...mapGetters({
      isBundle: 'payment/getIsBundle',
      _diskPercent: 'payment/getDiskPercent',
      diskUsedUi: 'payment/getDiskUsedUi'
    }),
    ...mapFields({
      userCountryInfo: 'userCountryInfo',
      usage: 'usage',
      bi: 'billingInfo',
      biv: 'billingInfoInvalid',
      isLoading: 'isLoading'
    }),
    ...mapState('payment', {
      status: 'status',
      card: 'cardInfo',
      isCancelingPro: 'isCancelingPro',
      myPaidDate: 'myPaidDate',
      myPrice: 'myPrice'
    }),
    isProIcon(): boolean { return ['Fail', 'Subscribed', 'Deleted', 'Canceled'].includes(this.status) },
    proIconColor(): string { return this.status === 'Fail' ? 'gray-3' : 'blue-1' },
    isFail(): boolean { return this.status === 'Fail' },
    isErrorStatus(): boolean { return ['-1', '-2', '-3', '-4', 'Transient'].includes(this.status) },
    showDueDay(): boolean { return ['Deleted', 'Canceled'].includes(this.status) },
    showPlan(): boolean { return ['Fail', 'Subscribed'].includes(this.status) },
    showUsage(): boolean { return ['Fail', 'Subscribed', 'Deleted', 'Canceled'].includes(this.status) },
    showBillingInfo(): boolean { return ['Fail', 'Leave', 'Abort', 'Subscribed', 'Deleted', 'Canceled'].includes(this.status) },
    canAdd(): boolean { return this.status === 'Initial' },
    canResume(): boolean { return ['Abort', 'Deleted', 'Canceled'].includes(this.status) },
    canSwitch(): boolean { return this.status === 'Subscribed' },
    canCancel(): boolean { return ['Fail', 'Subscribed'].includes(this.status) },
    canUpdateCard(): boolean { return ['Fail', 'Subscribed', 'Canceled'].includes(this.status) },
    contactUsUrl(): string { return paymentUtils.contactUsUrl() },
    diskPercent(): Record<string, string> {
      return { width: `${Math.min(1, this._diskPercent) * 100}%` }
    },
    billingInfoInput(): ReturnType<typeof paymentData.gerneral> {
      switch (this.userCountryInfo) {
        case 'tw':
          return [...paymentData.gerneral(), ...paymentData.TWonly()]
        case 'us':
          return [...paymentData.country(), ...paymentData.gerneral(), ...paymentData.USonly()]
        default:
          return [...paymentData.country(), ...paymentData.gerneral(), ...paymentData.others()]
      }
    },
    billingInfoCheck(): boolean { // Check if input is empty
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
    this.getPrice(this.userCountryInfo)
  },
  methods: {
    ...mapActions({
      init: 'payment/init',
      getBillingInfo: 'payment/getBillingInfo',
      getPrice: 'payment/getPrice',
      updateBillingInfoApi: 'payment/updateBillingInfo',
      checkBillingInfo: 'payment/checkBillingInfo',
      resumeApi: 'payment/resume'
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
    setUserCountryInfo(userCountryInfo: string) {
      const oldVal = this.userCountryInfo
      this.userCountryInfo = userCountryInfo

      if (userCountryInfo === 'tw') {
        this.$notify({ group: 'error', text: '如要取消開立統編，請先取消訂閱後選擇台灣再次訂閱。' })
        this.$nextTick(() => {
          // userCountryInfo should be set to other value and set back to oldVal, or it will display tw in dropdown.
          this.userCountryInfo = oldVal
        })
      }
    },
    openCardPopup() {
      this.init()
      this.showCardPopup = true
    },
    closeCardPopup() { this.showCardPopup = false },
    buy() { paymentUtils.openPayment('step1') },
    cancelSub() { paymentUtils.openPayment('cancel1') },
    switchPeriod() { paymentUtils.openPayment('switch1') }
  }
})
</script>

<style lang="scss" scoped>
input {
  @include default-input;
}

.sp {
  @include body-MD;
  padding: 60px 13% 20px 13%;
  text-align: left;
  &-plan,
  &-usage,
  &-card,
  &-info,
  > hr {
    margin-bottom: 30px;
  }
  &-plan,
  &-usage,
  &-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  &-plan,
  &-info {
    @include body-SM;
  }
  &-plan,
  &-usage {
    > span,
    > button,
    > svg {
      margin: 1px 0;
    }
  }
  &-error {
    @include body-XS;
    > a {
      text-transform: lowercase;
    }
  }
  > hr {
    border: 0.5px solid setColor(gray-4);
  }
}

.sp-plan {
  > button {
    @include btn-LG;
  }
}

.sp-usage-disk {
  display: flex;
  align-items: center;
  &-total,
  &-used {
    height: 10px;
  }
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
  row-gap: 20px;
}

.sp-info {
  max-width: 350px;
  label,
  input,
  select {
    margin-top: 10px;
  }
  label {
    color: setColor(gray-3);
  }
  &__half {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 10px;
  }
  > button {
    margin: 20px 0 0 auto;
  }
}

.sp-field {
  box-sizing: border-box;
  width: min(440px, 100%);
  padding: 20px 60px 40px 60px;
  background-color: white;
  position: absolute; // For close icon position
  text-align: center;
}

div.sp-rocket {
  z-index: 23;
}

@media screen and (max-width: 768px) {
  .sp {
    padding: 24px 6.4%;
  }
  .sp-field {
    padding: 65px 7.466% 130px 7.466%;
    bottom: 0px;
  }
}
</style>
