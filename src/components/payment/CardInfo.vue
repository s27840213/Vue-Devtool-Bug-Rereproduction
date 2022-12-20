<template lang="pug">
div(class="card")
  img(:src="`src/assets/img/svg/card/${card.issuer}.svg`")
  span {{`**** ${card.last4}`}}
  span {{`Expires ${card.date}`}}
  svg-icon(v-if="canDelete" class="pointer" iconName="trash"
          iconColor="gray-2" iconWidth="20px" @click="openPopup()")
  div(v-if="showPopup" class="popup-window")
    div(class="card-popup" v-click-outside="closePopup")
      div(class="text-H6") {{$t('NN0622')}}
      i18n-t(class="body-XS my-30" keypath="NN0623" tag="div")
        template(#paymentMethod)
          span(class="overline-LG") {{$t('NN0624')}}
      div(class="card-popup-button")
        btn(type="gray-mid" @click="closePopup()") {{$t('NN0203')}}
        btn(type="red-mid" @click="deleteCard()") {{$t('NN0625')}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import vClickOutside from 'click-outside-vue3'

export default defineComponent({
  emits: [],
  name: 'CardInfo',
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    card: {
      type: Object,
      required: true
    },
    canDelete: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showPopup: false
    }
  },
  methods: {
    ...mapActions({
      deleteCard: 'payment/deleteCard'
    }),
    openPopup() { this.showPopup = true },
    closePopup() { this.showPopup = false }
  }
})
</script>

<style lang="scss" scoped>
.card {
  display: flex;
  align-items: center;
  white-space: nowrap;
  >span, >svg {
    margin-left: 20px;
    flex-shrink: 0;
  }
}

.card-popup {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: 390px; height: 215px;
  padding: 37px;
  background-color: setColor(white);
  &-button {
    display: flex;
    button + button { margin-left: 40px; }
  }
}

@media screen and (max-width: 768px) {
  .card-popup {
    position: absolute;
    bottom: 0px;
    height: 395px;
    padding: 56px 37px 175px 37px;
  }
}
</style>
