<template lang="pug">
div(class="popup-page-scale bg-gray-6"
    @click.stop="closePopup")
  template(v-for="option in percentOptions" :key="option")
    div(class="popup-page-scale__item"
        @click="setPageScaleRatio(option)")
      span(class="body-2") {{`${option}%`}}
  hr(class="popup-page-scale__hr")
  div(class="popup-page-scale__item"
      @click="fitPage()")
    span(class="body-2") fit page
  div(class="popup-page-scale__item"
      @click="fillPage()")
    span(class="body-2") fill page
</template>

<script lang="ts">
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import { defineComponent } from 'vue'
import { mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  data() {
    return {
      percentOptions: [25, 50, 75, 100, 125, 150, 200, 300]
    }
  },
  methods: {
    ...mapMutations({
      setPageScaleRatio: 'SET_pageScaleRatio'
    }),
    fitPage() {
      pageUtils.fitPage()
    },
    fillPage() {
      pageUtils.fillPage()
    },
    closePopup() {
      popupUtils.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-page-scale {
  border-radius: 5px;
  width: 7rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: setZindex("dropdowns");
  border: 1px solid setColor(gray-4);
  box-shadow: 0px 0px 7px setColor(gray-1, 0.25);
  &__item {
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    text-align: center;
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
    margin: 0.375rem 0.5rem;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
  }
}
</style>
