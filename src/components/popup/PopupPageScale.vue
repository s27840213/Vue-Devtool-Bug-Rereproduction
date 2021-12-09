<template lang="pug">
  div(class="popup-page bg-gray-6"
      @click.stop="closePopup")
    template(v-for="option in percentOptions")
      div(class="popup-page__item"
          @click="setPageScaleRatio(option)")
        span(class="ml-10 body-2") {{`${option}%`}}
    div(class="popup-page__item"
        @click="option.action")
      svg-icon(
        class="pointer"
        :iconName="option.icon"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") {{option.text}}
      span(class="shortcut ml-10 body-2 text-gray-3") {{option.shortcutText}}
</template>

<script lang="ts">
import Vue from 'vue'
import popupUtils from '@/utils/popupUtils'
import { mapMutations } from 'vuex'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  data() {
    return {
    }
  },
  methods: {
    ...mapMutations({
      setPageScaleRatio: 'SET_pageScaleRatio'
    }),
    percentOptions() {
      return [25, 50, 75, 100, 125, 150, 200, 300]
    },
    fitPage() {
      pageUtils.fitPage()
    },
    fillPage() {
      pageUtils.fitPage()
    },
    closePopup() {
      popupUtils.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-page {
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.375rem 0.625rem;
  z-index: setZindex("dropdowns");
  border: 1px solid setColor(gray-4);
  box-shadow: 0px 0px 7px setColor(gray-1, 0.25);
  &__item {
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    &:hover {
      background-color: setColor(blue-3, 0.5);
    }
    &:active {
      background-color: setColor(blue-3);
    }
    > span {
      font-size: 0.75rem;
    }
  }

  &__hr {
    margin: 0.375rem 0;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
  }
}
</style>
