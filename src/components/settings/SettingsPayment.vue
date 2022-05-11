<template lang="pug">
  div(class="sp")
    div(v-if="!isPro" class="sp-free")
      p(class="text-blue-1")            {{$t('TMP0077')}}
      svg-icon(iconName="free")
      btn(class="rounded" type="primary-lg" @click.native="togglePro()")
        span                            {{$t('TMP0078')}}
    div(v-if="isPro" class="sp-pro")
      p(class="text-blue-1")            {{$t('TMP0077')}}
      svg-icon(iconName="pro")
      template(v-if="isCancelingPro")
        span(class="body-SM")           {{$t('TMP0084', {date: nextPaidDate})}}
        btn(class="rounded" type="primary-mid" @click.native="resume()")
          span                          {{$t('TMP0079')}}
      template(v-else)
        span(class="body-SM")           {{$t('TMP0080', { period: isBundle ? $t('TMP0011') : $t('TMP0010') })}}
        span(class="body-SM"      v-html="$t('TMP0081', { price: nextPrice, date: nextPaidDate  })")
        span(class="text-blue-1 body-SM pointer"
            @click="switchPeriod()")    {{$t('TMP0082', { period: isBundle ? $t('TMP0010') : $t('TMP0011')})}}
        span(class="text-gray-3 body-SM pointer"
            @click="cancelSub()")       {{$t('TMP0083')}}
      span(class="text-blue-1 mt-30")   {{$t('TMP0085')}}
      span(                       v-html="$t('TMP0086', { amount: usage.bgrmRemain, date: nextPaidDate })")
      span(class="body-XS")             {{$t('TMP0087')}}
      span(class="text-blue-1")         {{$t('TMP0088')}}
      div(class="sp-pro-disk")
        div(class="sp-pro-disk-total")
          div(class="sp-pro-disk-used" :style="diskPercent")
        span {{`${usage.diskUsed}/${usage.diskTotal}`}}
      span(class="body-XS")             {{$t('TMP0089')}}
    hr
    div(v-if="isPro && card.issuer" class="sp-detail")
      p(class="text-blue-1")            {{$t('TMP0090')}}
      card-info(:issuer="card.issuer" :last4="card.last4"
                :expire="card.date" :trash="isCancelingPro")
      p(class="text-blue-1 body-SM"
        @click="openCardPopup()")       {{$t('TMP0092')}}
    p(class="text-gray-3 pointer"
      @click="deletePlanCompletely()") {{'完全刪除plan（僅供測試）'}}
    hr(v-if="isPro")
    div(v-if="isPro" class="sp-info")
      p(class="text-blue-1")            {{$t('TMP0093')}}
      //- switch(input.label)
      template(v-for="input in billingInfoInput")
        //- case country
        options(v-if="input.label === 'country'" class="mb-10"
                :options="countryData" v-model="userCountryInfo")
        //- case state & zip
        div(v-else-if="input.label === 'state & zip'" class="sp-info__half")
          span
          label(for="zip") {{$t('TMP0105')}}
          options(class="mb-10" :options="stateData"
                  v-model="bi.state" :ph="$t('TMP0104')")
          input(id="zip" v-model="bi.zip" :invalid="biv.zip"
                :placeholder="$t('TMP0105')")
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
      card: 'cardInfo',
      bi: 'billingInfo',
      biv: 'billingInfoInvalid'
    }),
    ...mapState('payment', [
      'isPro',
      'isCancelingPro',
      'nextPaidDate',
      'nextPrice'
    ]),
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
    billingInfoCheck():boolean {
      for (const item of this.billingInfoInput) {
        switch (item.label) {
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
      togglePro: 'payment/togglePro', // todelete
      getBillingInfo: 'payment/getBillingInfo',
      getPrice: 'payment/getPrice',
      updateBillingInfoApi: 'payment/updateBillingInfo',
      checkBillingInfo: 'payment/checkBillingInfo',
      resumeApi: 'payment/resume',
      deletePlanCompletely: 'payment/deletePlanCompletely'
    }),
    async updateBillingInfo() {
      for (const item of this.billingInfoInput) {
        if (item.error && await this.checkBillingInfo(item.key)) return
      }
      this.updateBillingInfoApi()
    },
    resume() {
      if (this.card.issuer) this.resumeApi()
      else {
        this.paymentView = 'step1'
        this.showPaymentPopup = true
      }
    },
    openCardPopup() { this.showCardPopup = true },
    closeCardPopup() { this.showCardPopup = false },
    openPaymentPopup() { this.showPaymentPopup = true },
    closePaymentPopup() { this.showPaymentPopup = false },
    switchPeriod() {
      this.paymentView = 'switch'
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
  &-free, &-pro, &-detail, &-info {
    @include body-MD;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  >hr {
    width: 100%;
    border: 0.5px solid setColor(gray-4);
    margin: 14px 0;
  }
}

.sp-free {
  >button { @include btn-LG; }
}

.sp-pro-disk {
  display: flex;
  align-items: center;
  &-total{
    margin-right: 5px;
    width: 200px;
    height: 10px;
    border: 1px solid setColor(blue-1);
  }
  &-used {
    height: 10px;
    background-color: setColor(blue-1);
  }
}

.sp-info {
  width: 350px;
  label {
    @include body-SM;
    color: setColor(gray-3);
  }
  input {
    @include body-SM;
    width: 330px;
    height: 20px; // ask kitty
    margin: 10px 0;
    padding: 10px;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
    color: setColor(gray-2);
    &:focus { border-color: setColor(blue-1); }
    &[invalid="true"] { border-color: red; }
  }
  &__invalid {
    @include body-SM;
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
  >button { margin: 20px 0 0 auto; }
}

.sp-field{
  width: 320px;
  height: 300px;
  padding: 20px 60px 40px 60px;
  background-color: white;
}
</style>
