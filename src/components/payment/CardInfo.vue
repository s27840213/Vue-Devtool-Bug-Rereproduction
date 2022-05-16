<template lang="pug">
  div(class="card")
    img(:src="require(`@/assets/img/svg/card/${card.issuer}.svg`)")
    span {{`···· ···· ···· ${card.last4}`}}
    span {{`Expires ${card.date}`}}
    svg-icon(v-if="trash" class="pointer" iconName="trash"
            iconColor="gray-2" iconWidth="20px" @click.native="openPopup()")
    div(v-if="showPopup" class="popup-window")
      div(class="card-popup" v-click-outside="closePopup")
        div(class="card-popup-title") {{$t('TMP0117')}}
        i18n(class="card-popup-description" path="TMP0118" tag="div")
          template(#payment-method)
            span {{$t('TMP0119')}}
        div(class="card-popup-button")
          btn(type="gray-mid" @click.native="closePopup()") {{$t('NN0203')}}
          btn(class="card-popup-button-delete"
              @click.native="deleteCard()") {{$t('TMP0120')}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions } from 'vuex'
import vClickOutside from 'v-click-outside'

export default Vue.extend({
  name: 'CardInfo',
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    card: {
      type: Object,
      required: true
    },
    trash: {
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
  >span, >svg { margin-left: 20px; }
}

.card-popup {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 390px; height: 215px;
  background-color: setColor(white);
  &-title {
    @include text-H6;
  }
  &-description {
    @include body-XS;
    margin: 30px 0;
    >span { @include overline-LG; }
  }
  &-button {
    display: flex;
    &-delete {
      background-color: setColor(red) !important;
      margin-left: 40px;
    }
  }
}
</style>
