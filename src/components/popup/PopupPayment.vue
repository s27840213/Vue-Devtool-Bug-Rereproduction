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
      div(class="payment-left-content")
        template(v-if="view === 'step1'")
          div(v-for="p in periodInput" :isSelected="p.type === userPeriod"
              class="payment-left-content-period pointer"
              @click="setPeriod(p.isBundle)")
            svg-icon(iconWidth="20px"
                    :iconName="p.type === userPeriod ? 'radio-checked' : 'radio'"
                    :iconColor="p.type === userPeriod ? 'white' : 'gray-4'")
            span {{p.name}}
        template(v-if="view === 'step2'")
          PaymentField(@paid="paid")
        template(v-if="view === 'step3'")
          input(v-for="inv in invoiceInput" :type="inv.type"
                :value="invoice[inv.name]" @input="setInvoice(inv.name, $event)"
                class="payment-left-content-invoice pointer" :placeholder="inv.ph")
        template(v-if="view === 'cancel1'")
          div(v-for="can in cancel1")
            svg-icon(iconName="pro" iconWidth="24px")
            span {{can}}
        template(v-if="view === 'cancel2'")
          div(v-for="can in cancel2")
            //- todo radio-btn
            span {{can}}
      div(class="payment-left-button")
        btn(v-for="button in buttons" type="primary-lg"
            @click.native="button.func()")
          span {{button.text}}
        p(v-if="view === 'step1'") {{$t('TMP0042')}}
    //- move to jpg folder, compress?
    img(class="payment-right" :src="require(`@/assets/img/svg/pricing/${img}`)")
    img(v-if="view === 'finish'" class="payment-finish"
        src="@/assets/img/svg/pricing/finish.svg")

</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import vClickOutside from 'v-click-outside'
import PaymentField from '@/components/PaymentField.vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  name: 'PopupPayment',
  components: {
    PaymentField
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
      buttons: [{}],
      img: 'remover.jpg',
      // View constant
      periodInput: [{
        name: i18n.t('TMP0010'),
        type: 'monthly',
        isBundle: 0
      }, {
        name: i18n.t('TMP0011'),
        type: 'yearly',
        isBundle: 1
      }],
      invoiceInput: [{
        name: 'email',
        type: 'email',
        ph: 'Email'
      }, {
        name: 'name',
        type: 'text',
        ph: '姓名'
      }, {
        name: 'phone',
        type: 'tel',
        ph: '電話號碼'
      }, {
        name: 'GUI',
        type: 'text',
        ph: '統一編號(選填)'
      }],
      cancel1: [
        i18n.t('TMP0049'),
        i18n.t('TMP0050'),
        i18n.t('TMP0051'),
        i18n.t('TMP0052')
      ],
      cancel2: [
        i18n.t('TMP0056'),
        i18n.t('TMP0057'),
        i18n.t('TMP0058'),
        i18n.t('TMP0059'),
        i18n.t('TMP0060'),
        i18n.t('TMP0061')
      ]
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
      userPeriod: 'payment/getPeriod',
      isTW: 'payment/isTW'
    }),
    showPreStep(): boolean {
      return ['step2', 'step3', 'cancel2'].includes(this.view)
    },
    invoice():Record<string, string> {
      return this.$store.state.payment.invoice
    }
  },
  mounted() {
    this.changeView(this.initView)
  },
  methods: {
    ...mapMutations({
      setPeriod: 'payment/SET_isBundle',
      tappayAdd: 'payment/tappayAdd'
    }),
    changeView(name: string) {
      this.view = name
      console.log('view', name)
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
          this.title = '發票資訊'
          this.buttons = [{
            text: i18n.t('TMP0044') as string,
            func: () => {
              this.tappayAdd()
              this.changeView('finish')
            }
          }]
          break
        case 'finish':
          this.totalStep = 0
          break
        case 'switch':
          this.title = i18n.t('TMP0045') as string
          this.description = i18n.t('TMP0046') as string
          this.buttons = [{
            text: i18n.t('TMP0047') as string
            // func: () => this.changeView('step2') // todo
          }]
          break
        case 'cancel1':
          this.title = i18n.t('TMP0048') as string
          this.buttons = [{
            text: i18n.t('TMP0054') as string,
            func: () => this.closePopup()
          }, {
            text: i18n.t('TMP0053') as string,
            func: () => this.changeView('cancel2')
          }]
          break
        case 'cancel2':
          this.title = i18n.t('TMP0055') as string
          // this.buttons.func = () => ??? // todo
          break
      }
    },
    setInvoice(key: string, event: InputEvent) {
      this.$store.commit('payment/SET_invoice',
        Object.assign(this.invoice, { [key]: (event.target as HTMLInputElement).value })
      )
    },
    preStep() {
      switch (this.view) {
        case 'step2':
          this.changeView('step1')
          break
        case 'step3':
          this.changeView('step2')
          break
        case 'cancel2':
          this.changeView('cancle1')
          break
      }
    },
    paid() { // rename?
      this.userCountry.value === 'TW' ? this.changeView('step3') : this.changeView('finish')
    },
    closePopup() {
      this.changeView('step1') // todelete
      this.$emit('close')
    }
  }
})
</script>

<style lang="scss" scoped>
.payment {
  display: flex;
  position: relative;
  width: 900px;
  height: 800px;
  flex-shrink: 0;
  background-color: white;
  overflow: auto;
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
  align-items: center;
  width: calc(50% - 40px);
  padding: 20px;
  &-top {
    @include body-MD;
    align-self: flex-start;
    color: setColor(gray-1);
    &__step {
      display: flex;
      align-items: center;
      >svg { margin-right: 15px; }
    }
    &__title {
      @include text-H4;
      margin: 28px 0 16px;
    }
  }
  &-button {
    width: 90%;
    text-align: center;
    >button {
      width: 100%;
      border-radius: 4px;
    }
  }
}

.payment-left-content { width: 90%; }

.payment-left-content-period{
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  height: 52px;
  margin: 16px 0;
  padding: 10px;
  border: 1px solid setColor(gray-3);
  border-radius: 4px;
  &[isSelected] {
    background-color: setColor(blue-1);
    color: white;
  }
}

.payment-left-content-invoice{
  @include body-SM;
  width: calc(100% - 22px);
  height: 20px;
  margin: 5px 0;
  padding: 10px;
  border: 1px solid setColor(gray-3);
  border-radius: 4px;
}

.payment-right {
  width: 50%;
}

.payment-finish {
  position: absolute;
  left: 10%;
  width: 80%;
}
</style>
