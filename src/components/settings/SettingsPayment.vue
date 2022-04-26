<template lang="pug">
  div(class="sp")
    div(class="sp-plan")
      p(class="text-blue-1")            {{$t('TMP0065')}}
      svg-icon(iconName="pro")
      span(class="body-SM")             {{$t('TMP0067')}}
      span(class="body-SM")             {{$t('TMP0068')}}
      span(class="text-blue-1 body-SM"
          @click="switchPeriod()")      {{$t('TMP0069', { period: isBundle ? $t('TMP0010') : $t('TMP0011')})}}
      span(class="text-gray-3 body-SM"
          @click="cancelSub()")         {{$t('TMP0070')}}
      p(class="text-blue-1")            {{$t('TMP0071')}}
      p {{$t('TMP0072')}}
      span(class="body-XS")             {{$t('TMP0073')}}
      p(class="text-blue-1")            {{$t('TMP0074')}}
      span(class="body-XS")             {{$t('TMP0075')}}
    div(class="sp-detail")
      p(class="text-blue-1")            {{$t('TMP0076')}}
      span(class="body-SM")             {{$t('TMP0077')}}
      p(class="text-blue-1 body-SM")    {{$t('TMP0078')}}
    div(class="sp-info")
      p(class="text-blue-1")            {{$t('TMP0079')}}
      p {{$tc('NN0173', 1)}}
      p {{$t('TMP0080')}}
      p {{$t('NN0172')}}
      p {{$t('TMP0081')}}
      p {{$t('TMP0082')}}
      p {{$t('TMP0083')}}
      p {{$t('TMP0084')}}
      p {{$t('TMP0085')}}
      p {{$t('TMP0084')}}
      p {{$t('TMP0086')}}
      p {{$t('TMP0087')}}
      p {{$t('TMP0087')}}
      p {{$t('TMP0088')}}
      p {{$t('TMP0089')}}
      p {{$t('TMP0089')}}
    div(v-if="showPopup" class="popup-window")
      popup-payment(:initView="paymentView" @close="closePopup()")
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapGetters } from 'vuex'
import PopupPayment from '@/components/popup/PopupPayment.vue'

export default Vue.extend({
  name: 'SettingsPayment',
  components: {
    PopupPayment
  },
  props: {
  },
  data() {
    return {
      showPopup: false,
      paymentView: ''
    }
  },
  computed: {
    ...mapGetters({
      isBundle: 'payment/getIsBundle'
    })
  },
  // mounted() {
  // },
  methods: {
    openPopup() { this.showPopup = true },
    closePopup() { this.showPopup = false },
    switchPeriod() {
      this.paymentView = 'switch'
      this.showPopup = true
    },
    cancelSub() {
      this.paymentView = 'cancel1'
      this.showPopup = true
    }
  }
})
</script>

<style lang="scss" scoped>
.sp {
  padding: 60px 13% 20px 13%;
  &-plan, &-detail, &-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
}

.payment-plan {
  @include body-MD
}
</style>
