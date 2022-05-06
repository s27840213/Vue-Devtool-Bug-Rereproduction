<template lang="pug">
  div(class="payment" v-click-outside="closePopup")
    div(class="payment__close")
      svg-icon(iconName="page-close" iconWidth="10px" iconColor="gray-0"
              class="pointer" @click.native="closePopup()")
    div(class="payment-left")
      div(class="payment-left-top")
        div(v-if="totalStep" class="payment-left-top__step")
          svg-icon(v-if="showPreStep" iconName="left-arrow" iconWidth="24px"
                  iconColor="gray1" @click.native="preStep()")
          span {{$t('TMP0038')}} {{currentStep}} of {{totalStep}}
        div(class="payment-left-top__title") {{title}}
        div(v-if="description" class="payment-left-top__description") {{description}}
      div(class="payment-left-content" :view="view")
        //- switch(view)
        template(v-if="['step1', 'switch'].includes(view)")
          div(v-for="p in periodInput" :isSelected="p.type === userPeriod"
              class="payment-left-content-period pointer"
              @click="setPeriod(p.isBundle)")
            svg-icon(iconWidth="20px"
                    :iconName="p.type === userPeriod ? 'radio-checked' : 'radio'"
                    :iconColor="p.type === userPeriod ? 'white' : 'gray-4'")
            span {{p.label}}
        template(v-if="view === 'step2'")
          PaymentField(@paid="paid")
        template(v-if="view === 'step3'")
          input(v-for="inv in invoiceInput" :type="inv.type"
                :value="invoice[inv.name]" @input="setInvoice(inv.name, $event)"
                class="payment-left-content-invoice" :placeholder="inv.ph")
        template(v-if="view === 'cancel1'")
          div(v-for="can in cancel1" class="payment-left-content-cancel")
            svg-icon(iconName="pro" iconWidth="24px")
            span {{can}}
        template(v-if="view === 'cancel2'")
          div(v-for="can, idx in cancel2" class="payment-left-content-cancel")
            //- todo: for label prop
            radio-btn(:isSelected="reasonIndex === idx"
                      :formatKey="String(idx)" circleColor="gray-4"
                      @select="selectCancelReason(idx)")
            span {{can}}
          input(class="payment-left-content-cancel__other"
                v-model="otherReason" :placeholder="$t('TMP0069')")
      p(v-if="view === 'step1'"
        class="payment-left-button-description") {{$t('TMP0042')}}
      div(class="payment-left-button")
        btn(v-for="button in buttons" :type="button.type || 'primary-lg'"
            @click.native="button.func()"
            :disabled="button.disabled ? button.disabled() : false")
          span {{button.text}}
    //- move to jpg folder, compress?
    img(class="payment-right" :src="require(`@/assets/img/jpg/pricing/${img}`)")
    div(v-if="view === 'finish'" class="payment-finish")
      animation(path="/lottie/us/pro.json")

</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import i18n from '@/i18n'
import vClickOutside from 'v-click-outside'
import PaymentField from '@/components/PaymentField.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import Animation from '@/components/Animation.vue'
import paymentData from '@/utils/paymentData'

export default Vue.extend({
  name: 'PopupPayment',
  components: {
    PaymentField,
    RadioBtn,
    Animation
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
      periodInput: paymentData.periodInput(),
      invoiceInput: paymentData.invoiceInput(),
      cancel1: paymentData.cancel1(),
      cancel2: paymentData.cancel2(),
      // User input
      reasonIndex: '-1', // todo move to store
      otherReason: ''
    }
  },
  watch: {
    userCountry() {
      this.totalStep = this.isTW ? 3 : 2
    }
  },
  computed: {
    ...mapGetters({
      userCountry: 'payment/getUserCountry',
      isBundle: 'payment/getIsBundle',
      isTW: 'payment/isTW'
    }),
    userPeriod():string {
      return (this.view === 'switch' ? 1 - this.isBundle : this.isBundle) ? 'yearly' : 'monthly'
    },
    showPreStep(): boolean {
      return ['step2', 'step3'].includes(this.view)
    },
    // invoice():Record<string, string> {
    //   return this.$store.state.payment.billinfInfo
    // },
    cancelReason(): string {
      return Number(this.reasonIndex) < this.cancel2.length - 1
        ? this.cancel2[Number(this.reasonIndex)] as string
        : this.otherReason
    }
  },
  mounted() {
    this.changeView(this.initView)
  },
  methods: {
    ...mapActions({
      tappayAdd: 'payment/tappayAdd',
      switchToBundle: 'payment/switchToBundle',
      cancelApi: 'payment/cancel'
    }),
    ...mapMutations({
      setIsBundle: 'payment/SET_isBundle'
    }),
    changeView(name: string) {
      this.view = name
      switch (name) {
        case 'step1':
          this.currentStep = 1
          this.totalStep = i18n.locale === 'tw' ? 3 : 2
          this.title = i18n.t('TMP0039') as string
          this.description = i18n.t('TMP0040') as string
          this.buttons = [{
            text: i18n.t('TMP0041') as string,
            func: () => this.changeView('step2')
          }]
          this.img = 'remover.jpg'
          break
        case 'step2':
          this.currentStep = 2
          this.title = i18n.t('TMP0043') as string
          this.description = ''
          this.buttons = [] // Use button in PaymentField.vue
          this.img = 'pro-template.jpg'
          break
        case 'step3':
          this.currentStep = 3
          this.title = i18n.t('TMP0046') as string
          this.buttons = [{
            text: i18n.t('TMP0051') as string,
            func: () => {
              this.tappayAdd()
              this.changeView('finish')
            }
          }]
          break
        case 'finish':
          break
        case 'switch':
          this.title = i18n.t('TMP0052') as string
          this.description = i18n.t('TMP0053') as string
          this.buttons = [{
            text: i18n.t('TMP0054') as string,
            func: () => {
              this.switchToBundle()
              this.closePopup() // refresh or double check?
            }
          }]
          break
        case 'cancel1':
          this.title = i18n.t('TMP0055') as string
          this.buttons = [{
            text: i18n.t('TMP0061') as string,
            func: () => this.closePopup()
          }, {
            type: 'light-lg',
            text: i18n.t('TMP0060') as string,
            func: () => this.changeView('cancel2')
          }]
          this.img = 'pro-template2.jpg'
          break
        case 'cancel2':
          this.title = i18n.t('TMP0062') as string
          this.buttons[1].disabled = () => ['', undefined].includes(this.cancelReason)
          this.buttons[1].func = this.cancel
          this.img = 'brandkit.jpg'
          break
      }
    },
    preStep() {
      if (this.view === 'step2') this.changeView('step1')
      else if (this.view === 'step3') this.changeView('step2')
    },
    // setInvoice(key: string, event: InputEvent) {
    //   this.$store.commit('payment/SET_invoice',
    //     Object.assign(this.invoice, { [key]: (event.target as HTMLInputElement).value })
    //   )
    // },
    paid() { // rename?
      this.isTW ? this.changeView('step3') : this.changeView('finish')
    },
    setPeriod(isBundle: boolean) {
      if (this.view === 'step1') { this.setIsBundle(isBundle) }
    },
    selectCancelReason(can: string) {
      this.reasonIndex = can
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
.payment {
  display: flex;
  position: relative;
  width: min(792px, min(90vw, 101.25vh));
  height: min(704px, min(80vw, 90vh));
  flex-shrink: 0;
  background-color: white; // ?
  overflow: auto; // ?
  text-align: left;
  &__close {
    position: absolute;
    top: 0px;
    right: 0px;
  }
}

.payment-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  position: relative;
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
  &-button-description {
    position: absolute;
    bottom: 9%
  }
  &-button {
    // margin-top: auto;
    // display: flex;
    // flex-direction: column;
    >button {
      @include btn-LG;
      width: 100%;
      border-radius: 4px;
    }
    >button:nth-child(2) {
      margin-top: 20px;
      border: none;
    }
  }
}

.payment-left-content-period {
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  height: 52px; // ?
  margin: 16px 0;
  padding: 10px;
  border: 1px solid setColor(gray-3);
  border-radius: 4px;
  &[isSelected] {
    background-color: setColor(blue-1);
    color: white;
  }
}

.payment-left-content-invoice {
  @include body-SM;
  width: calc(100% - 22px);
  // height: 20px; // ask kitty
  margin: 5px 0;
  padding: 10px;
  border: 1px solid setColor(gray-3);
  border-radius: 4px;
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
  .animation {
    width: min(80vh, 80vw);
    height: min(80vh, 80vw);
  }
}
</style>
