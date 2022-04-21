<template lang="pug">
  div(class="payment" v-click-outside="closePopup")
    div(class="payment__close")
      svg-icon(iconName="page-close" iconWidth="10px" iconColor="gray-0"
              class="pointer" @click.native="closePopup()")
    div(class="payment-left")
      div(class="payment-left-top")
        div(v-if="totalStep" class="payment-left-top__step") {{$t('TMP0038')}} {{currentStep}} of {{totalStep}}
        div(class="payment-left-top__title") {{title}}
        div(v-if="description" class="payment-left-top__description") {{description}}
      div(class="payment-left-content")
        template(v-if="view === 'step1'")
          div(v-for="radio in [$t('TMP0010'), $t('TMP0011')]"
              class="payment-left-content-period"
              :checked="period === radio")
            radio-btn(class="payment-left-content-period__radio"
                      :isSelected="period === radio"
                      :formatKey="radio" circleColor="gray-4"
                      @select="selectPeriod")
            span {{radio}}
        template(v-if="view === 'step2'")
        template(v-if="view === 'step3'")
        template(v-if="view === 'cancel1'")
        template(v-if="view === 'cancel2'")
      div(class="payment-left-button")
        btn(v-for="button in buttons" type="primary-lg"
            class="payment-left-button???" @click.native="button.func()")
          span {{button.text}}
        div(v-if="showButtonDescription"
            class="payment-left-button__description") {{$t('TMP0042')}}
    //- move to jpg folder, compress?
    img(class="payment-right" src="@/assets/img/svg/pricing/remover.jpg")
    img(v-if="view === 'finish'" class="payment-finish"
        src="@/assets/img/svg/pricing/finish.svg")

</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import vClickOutside from 'v-click-outside'
import RadioBtn from '@/components/global/RadioBtn.vue'

export default Vue.extend({
  name: 'PopupPayment',
  components: {
    RadioBtn
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
      showButtonDescription: false,
      // User data
      period: i18n.t('TMP0010')
    }
  },
  computed: {
  },
  mounted() {
    this.changeView(this.initView)
  },
  methods: {
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
          this.showButtonDescription = true
          break
        case 'step2':
          this.currentStep = 2
          this.title = i18n.t('TMP0043') as string
          this.description = ''
          this.buttons = [{
            text: i18n.t('TMP0044') as string,
            func: () => this.changeView('finish')
          }]
          this.showButtonDescription = false
          break
        case 'step3':
          this.currentStep = 3
          break
        case 'finish':
          this.totalStep = 0
          break
        case 'switch':
          break
        case 'cancel1':
          break
        case 'cancel2':
          break
      }
    },
    selectPeriod(key: string) { this.period = key },
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
  width: 50%;
  &-top {
    @include body-MD;
    color: setColor(gray-1);
    &__title {
      @include text-H4;
      margin: 28px 0 16px;
    }
  }
  &-button >button {
    border-radius: 4px;
  }
}

.payment-left-content-period{
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  width: 320px;
  height: 72px;
  margin: 16px 0;
  border: 1px solid setColor(gray-3);
  border-radius: 4px;
  &:checked {
    background-color: setColor(blue-1);
  }
  &__radio { margin: 10px; }
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
