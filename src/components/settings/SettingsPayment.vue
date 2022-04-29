<template lang="pug">
  div(class="sp")
    div(v-if="!isPro" class="sp-free")
      p(class="text-blue-1")            {{$t('TMP0070')}}
      svg-icon(iconName="free")
      btn(class="rounded" type="primary-lg" @click.native="togglePro()")
        span                            {{$t('TMP0071')}}
    div(v-if="isPro" class="sp-pro")
      p(class="text-blue-1")            {{$t('TMP0070')}}
      //- todelete @click
      svg-icon(iconName="pro"
              @click.native="togglePro()")
      span(class="body-SM")             {{$t('TMP0072', { period: isBundle ? $t('TMP0011') : $t('TMP0010') })}}
      span(class="body-SM"        v-html="$t('TMP0073', { price: nextPrice, date: nextPaidDate  })")
      span(class="text-blue-1 body-SM pointer"
          @click="switchPeriod()")      {{$t('TMP0074', { period: isBundle ? $t('TMP0010') : $t('TMP0011')})}}
      span(class="text-gray-3 body-SM pointer"
          @click="cancelSub()")         {{$t('TMP0075')}}
      p(class="text-blue-1")            {{$t('TMP0076')}}
      span(                       v-html="$t('TMP0077', { amount: bgrmCredit, date: nextPaidDate })")
      span(class="body-XS")             {{$t('TMP0078')}}
      p(class="text-blue-1")            {{$t('TMP0079')}}
      span(class="body-XS")             {{$t('TMP0080')}}
    hr
    div(v-if="isPro" class="sp-detail")
      p(class="text-blue-1")            {{$t('TMP0081')}}
      span(class="body-SM")             {{`···· ···· ···· ${lastFour}  ${$t('TMP0082')} ${expireDate}`}}
      p(class="text-blue-1 body-SM"
        @click="openCardPopup()")       {{$t('TMP0083')}}
    hr(v-if="isPro")
    div(v-if="isPro" class="sp-info")
      //- todo reuse
      p(class="text-blue-1")            {{$t('TMP0084')}}
      span                              {{$tc('NN0173', 1)}}
      input(                :placeholder="$t('TMP0085')")
      span                              {{$t('NN0172')}}
      input(                :placeholder="$t('TMP0086')")
      span                              {{$t('TMP0047')}}
      input(                :placeholder="$t('')")
      span                              {{$t('TMP0048')}}
      input(                :placeholder="$t('')")
      btn(type="primary-sm")            {{$t('NN0176')}}
    div(v-if="isPro" class="sp-info")
      p(class="text-blue-1")            {{$t('TMP0084')}}
      options(class="mb-10" :options="countryData" v-model="userCountry")
      span                              {{$tc('NN0173', 1)}}
      input(                :placeholder="$t('TMP0085')")
      span                              {{$t('NN0172')}}
      input(                :placeholder="$t('TMP0086')")
      span                              {{$t('TMP0087')}}
      input(                :placeholder="$t('TMP0088')")
      span                              {{$t('TMP0089', { number: 1 })}}
      input(                :placeholder="$t('TMP0090')")
      span                              {{$t('TMP0089', { number: 2 })}}
      input(                :placeholder="$t('TMP0091')")
      span                              {{$t('TMP0092')}}
      input(                :placeholder="$t('TMP0092')")
      div(class="sp-info__half")
        span
        span                            {{$t('TMP0094')}}
        options(class="mb-10" :options="stateData"
                v-model="testState"  :ph="$t('TMP0093')")
        input(              :placeholder="$t('TMP0094')")
      btn(type="primary-sm")            {{$t('NN0176')}}
    div(v-if="showCardPopup" class="popup-window" )
      div(class="sp-field" v-click-outside="closeCardPopup")
        payment-field(isChange)
    div(v-if="showPaymentPopup" class="popup-window")
      popup-payment(:initView="paymentView" @close="closePaymentPopup()")
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapActions, mapGetters, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import vClickOutside from 'v-click-outside'
import Options from '@/components/global/Options.vue'
import PaymentField from '@/components/PaymentField.vue'
import PopupPayment from '@/components/popup/PopupPayment.vue'
import countryData from '@/assets/json/countries.json'
import stateData from '@/assets/json/us_state.json'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default Vue.extend({
  name: 'SettingsPayment',
  components: {
    Options,
    PaymentField,
    PopupPayment
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      countryData,
      stateData,
      showCardPopup: false,
      showPaymentPopup: false,
      paymentView: '',
      testState: null // todelete
    }
  },
  computed: {
    ...mapGetters({
      isBundle: 'payment/getIsBundle'
    }),
    ...mapFields({
      userCountry: 'userCountry'
    }),
    ...mapState('payment', [
      'isPro',
      'nextPrice',
      'nextPaidDate',
      'bgrmCredit',
      'lastFour',
      'expireDate'
    ])
  },
  methods: {
    ...mapActions({
      togglePro: 'payment/togglePro' // todelete
    }),
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

.sp-info {
  width: 350px;
  span {
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
