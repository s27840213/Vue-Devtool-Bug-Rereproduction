<template lang="pug">
  div(class="wrapper1")
    div(class="close pointer")
      svg-icon(iconName="page-close" iconWidth="17px" iconColor="gray-0"
              @click.native="closePopup()")
    div(class="wrapper2")
      div(class="payment" v-click-outside="closePopup")
        div(class="payment-left")
          div(class="payment-left-top")
            div(class="payment-left-top__step")
              svg-icon(v-if="showPreStep" iconName="left-arrow" iconWidth="24px"
                      iconColor="gray1" @click.native="preStep()")
              span(v-if="totalStep") {{$t('TMP0040')}} {{currentStep}} of {{totalStep}}
            div(class="payment-left-top__title") {{title}}
            div(v-if="description" class="payment-left-top__description") {{description}}
          //- switch(view)
          div(class="payment-left-content" :view="view")
            //- case step1 or switch1
            template(v-if="['step1', 'switch1'].includes(view)")
              div(v-for="p in periodInput" :isSelected="p.value === userPeriod"
                  class="payment-left-content-period pointer"
                  @click="setPeriod(p.value)")
                svg-icon(iconWidth="20px"
                        :iconName="p.value === userPeriod ? 'radio-checked' : 'radio'"
                        :iconColor="p.value === userPeriod ? 'white' : 'gray-4'")
                div(class="payment-left-content-period-price")
                  span(class="payment-left-content-period-price__label") {{p.label}} {{curPlan(p.value)}}
                  span(class="payment-left-content-period-price__amount") {{`$${plans[planSelected][p.value].now}`}}
                    span(class="payment-left-content-period-price__end") {{`${$t('TMP0012')}${p.value==='yearly' ? $t('TMP0044') : ''}`}}
                span(v-if="p.value==='yearly'"
                    class="payment-left-content-period__off") {{$t('TMP0045')}}
            //- case step2
            template(v-if="view === 'step2'")
              PaymentField(@next="changeView('finish')")
            //- case switch2
            template(v-if="view === 'switch2'")
              card-info(:card="card")
              div(class="payment-left-content-switch2")
                span(v-if="switchPaidDate") {{$t('TMP0049', {date: switchPaidDate})}}
                span(v-else) {{$t('TMP0050')}}
                span {{`$${switchPrice}`}}
            //- case cancel1
            template(v-if="view === 'cancel1'")
              div(v-for="can in cancel1" class="payment-left-content-cancel")
                svg-icon(iconName="pro" iconWidth="24px")
                span {{can}}
            //- case cancel2
            template(v-if="view === 'cancel2'")
              div(v-for="can, idx in cancel2" class="payment-left-content-cancel")
                radio-btn(:isSelected="reasonIndex === idx"
                          :formatKey="String(idx)" circleColor="gray-4"
                          @select="selectCancelReason(idx)")
                span {{can}}
              input(class="payment-left-content-cancel__other"
                    v-model="otherReason" :placeholder="$t('TMP0080')")
          div(class="payment-left-button")
            btn(v-for="button in buttons" :type="button.type || 'primary-lg'"
                @click.native="button.func()"
                :disabled="button.disabled ? button.disabled() : false")
              span {{button.text}}
            span(v-if="view === 'step1' && trialStatus === 'not used'"
                class="payment-left-button-description") {{$t('TMP0047')}}
        img(class="payment-right" :src="require(`@/assets/img/jpg/pricing/${img}`)")
        div(v-if="view === 'finish'" class="payment-finish")
          animation(path="/lottie/pro.json")
          div(class="payment-finish-description")
            span {{$t('TMP0058')}}
            btn(type="primary-mid" @click.native="closePopup()") {{$t('TMP0060')}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import i18n from '@/i18n'
import vClickOutside from 'v-click-outside'
import PaymentField from '@/components/payment/PaymentField.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import Animation from '@/components/Animation.vue'
import CardInfo from '@/components/payment/CardInfo.vue'
import paymentData from '@/utils/paymentData'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default Vue.extend({
  name: 'PopupPayment',
  components: {
    PaymentField,
    RadioBtn,
    Animation,
    CardInfo
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    initView: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // View variable
      view: '',
      currentStep: 0,
      totalStep: 0,
      title: '',
      description: '',
      buttons: [{}] as {type?: string, disabled?: ()=>boolean, text: string, func: ()=>void}[],
      img: 'remover.jpg',
      // View constant
      periodInput: paymentData.periodOptions(),
      cancel1: paymentData.cancel1(),
      cancel2: paymentData.cancel2(),
      // User input
      reasonIndex: '-1',
      otherReason: ''
    }
  },
  computed: {
    ...mapGetters({
      isBundle: 'payment/getIsBundle'
    }),
    ...mapFields({
      periodUi: 'periodUi'
    }),
    ...mapState('payment', {
      switchPaidDate: 'switchPaidDate',
      switchPrice: 'switchPrice',
      card: 'cardInfo',
      plans: 'plans',
      planSelected: 'planSelected',
      trialStatus: 'trialStatus'
    }),
    userPeriod():string {
      return ['switch1', 'switch2'].includes(this.view)
        ? (this.isBundle ? 'monthly' : 'yearly')
        : this.periodUi
    },
    showPreStep(): boolean {
      return ['step2', 'switch2'].includes(this.view)
    },
    cancelReason(): string {
      return Number(this.reasonIndex) < this.cancel2.length - 1
        ? this.cancel2[Number(this.reasonIndex)] as string
        : this.otherReason
    }
  },
  mounted() {
    // this.getBillingInfo()
    this.changeView(this.initView)
  },
  methods: {
    ...mapActions({
      getBillingInfo: 'payment/getBillingInfo',
      init: 'payment/init',
      getSwitchPrice: 'payment/getSwitchPrice',
      switch: 'payment/switch',
      cancelApi: 'payment/cancel'
    }),
    changeView(name: string) {
      this.view = name
      switch (name) {
        case 'step1':
          this.init()
          this.currentStep = 1
          this.totalStep = 2
          this.title = i18n.t('TMP0041') as string
          this.description = (this.trialStatus === 'not used' ? i18n.t('TMP0042') : i18n.t('TMP0043')) as string
          this.buttons = [{
            text: i18n.t('TMP0046') as string,
            func: () => this.changeView('step2')
          }]
          this.img = 'remover.jpg'
          break
        case 'step2':
          this.currentStep = 2
          this.title = i18n.t('TMP0048') as string
          this.description = ''
          this.buttons = [] // Use button in PaymentField.vue
          this.img = 'pro-template.jpg'
          break
        case 'finish':
          this.getBillingInfo()
          break
        case 'switch1':
          this.getSwitchPrice()
          this.title = i18n.t('TMP0061', { period: this.isBundle ? i18n.t('TMP0010') : i18n.t('TMP0011') }) as string
          this.description = (this.isBundle ? i18n.t('TMP0063') : i18n.t('TMP0062')) as string
          this.buttons = [{
            text: i18n.t('TMP0064', { period: this.isBundle ? i18n.t('TMP0010') : i18n.t('TMP0011') }) as string,
            func: () => this.changeView('switch2')
          }]
          break
        case 'switch2':
          this.title = i18n.t('TMP0048') as string
          this.description = i18n.t('TMP0065') as string
          this.buttons = [{
            text: i18n.t('TMP0061', { period: this.isBundle ? i18n.t('TMP0010') : i18n.t('TMP0011') }) as string,
            func: async () => {
              await this.switch()
              this.closePopup() // refresh or double check?
            }
          }]
          this.img = 'pro-template.jpg'
          break
        case 'cancel1':
          this.title = i18n.t('TMP0066') as string
          this.buttons = [{
            text: i18n.t('TMP0072') as string,
            func: () => this.closePopup()
          }, {
            type: 'light-lg',
            text: i18n.t('TMP0071') as string,
            func: () => this.changeView('cancel2')
          }]
          this.img = 'pro-template2.jpg'
          break
        case 'cancel2':
          this.title = i18n.t('TMP0073') as string
          this.buttons[1].disabled = () => ['', undefined].includes(this.cancelReason)
          this.buttons[1].func = this.cancel
          this.img = 'brandkit.jpg'
          break
      }
    },
    setPeriod(value: string) {
      if (this.view === 'step1') { this.periodUi = value }
    },
    preStep() {
      if (this.view === 'step2') this.changeView('step1')
      else if (this.view === 'switch2') this.changeView('switch1')
    },
    curPlan(period: string):string {
      return this.view === 'switch1' && period !== this.userPeriod ? '(current plan)' : ''
    },
    selectCancelReason(index: string) {
      this.reasonIndex = index
    },
    cancel() {
      // todo test no reason
      this.cancelApi(this.cancelReason).then(
        this.closePopup
      ).catch(msg => Vue.notify({ group: 'error', text: msg }))
    },
    closePopup() { this.$emit('close') }
  }
})
</script>

<style lang="scss" scoped>
.wrapper1 {
  position: relative;
  .close {
    position: absolute;
    top: -18px;
    right: -18px;
    width: 36px; height: 36px;
    background-color: setColor(white);
    border-radius: 100px;
    z-index: 1;
    >svg { margin: 9.5px; }
  }
  .wrapper2 {
  @include hide-scrollbar;
  // position: relative;
  width: min(792px, min(90vw));
  height: min(704px, min(80vw, 90vh));
}
}

.payment {
  display: flex;
  // position: relative;
  width: min(792px, 90vw);
  height: min(704px, 80vw);
  flex-shrink: 0;
  background-color: white; // ?
  // overflow: auto; // ?
  text-align: left;
}

.payment-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  // align-items: center;
  width: calc(50% - 40px);
  padding: 12% 20px 15% 20px;
  &-top, &-content, &-button { width: 100%; }
  &-top {
    @include body-MD;
    position: relative;
    margin-bottom: 16px;
    color: setColor(gray-1);
    &__step {
      display: flex;
      align-items: center;
      position: absolute;
      top: -40px;
      >svg { margin-right: 15px; }
    }
    &__title { @include text-H4; }
    &__description { margin-top: 16px; }
  }
  &-content {
    height: 100%;
    input {
      &:focus { border-color: setColor(blue-1); }
      &:invalid { border-color: red; }
    }
  }
  &-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    >button {
      @include btn-LG;
      width: 100%;
      border-radius: 4px;
    }
    >button:nth-child(2) {
      margin-top: 20px;
      border: none;
    }
    &-description {
      position: absolute;
      bottom: -60%;
      white-space: nowrap;
    }
  }
}

.payment-left-content-period {
  display: flex;
  align-items: center;
  height: 52px; // ?
  margin: 16px 0;
  padding: 10px;
  border: 1px solid setColor(gray-3);
  border-radius: 4px;
  &-price {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 10px;
    &__label {
      @include btn-LG;
      text-transform: capitalize;
    }
    &__amount { @include text-H6; }
    &__end { @include body-XS; }
  }
  &__off {
    @include overline-SM;
    white-space: nowrap;
  }
  &:not([isSelected]) &__off { color: setColor(red-1); }
  &[isSelected] {
    background-color: setColor(blue-1);
    color: white;
  }
}

.payment-left-content-switch2 {
  @include overline-LG;
  display: flex;
  justify-content: space-between;
  margin-top: 23px;
}

.payment-left-content-cancel {
  @include body-MD;
  display: flex;
  >svg, >div {
    flex-shrink: 0;
    margin-right: 15px;
  }
  &__other {
    @include body-SM; // ask kitty
    width: calc(100% - 22px);
    height: 20px; // ask kitty
    margin: 5px 0; // ask kitty
    padding: 10px;
    border: 1px solid setColor(gray-3);
    border-radius: 4px;
  }
}

.payment-finish {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: white;
  .animation { height: 100%; }
  &-description {
    @include body-SM;
    position: absolute;
    top: 55%;
    width: 70%;
    text-align: center;
    >button {
      @include btn-LG;
      margin: 20px auto;
    }
  }
}
</style>
