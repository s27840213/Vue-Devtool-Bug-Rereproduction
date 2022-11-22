<template lang="pug">
div(class="popup-page bg-gray-6"
    @click.stop="closePopup")
  div(v-for="(data,index) in shortcutMenu()"
      :key="`popup-page__shortcut-${index}`"
      class="popup-page__item"
      @click="data.action")
    span(class="ml-10 body-2") {{data.text}}
    span(class="shortcut ml-10 body-2 text-gray-3") {{data.shortcutText}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import popupUtils from '@/utils/popupUtils'
import rulerUtils from '@/utils/rulerUtils'

export default defineComponent({
  data() {
    return {
    }
  },
  computed: {
  },
  methods: {
    shortcutMenu() {
      return [
        {
          text: `${this.$t('NN0502')}`,
          shortcutText: '',
          action: () => {
            rulerUtils.deleteLastMapedGuideline()
          }
        },
        {
          text: `${this.$t('NN0075')}`,
          shortcutText: '',
          action: () => {
            rulerUtils.clearGuidelines()
          }
        },
        {
          text: `${this.$t('NN0074')}`,
          shortcutText: '',
          action: () => {
            rulerUtils.setShowGuideline(false)
          }
        }
      ]
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
