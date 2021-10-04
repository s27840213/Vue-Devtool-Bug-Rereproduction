<template lang="pug">
  div(class="popup bg-white")
    component(:is="component"
    v-click-outside="vcoConfig")
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import PopupOrder from '@/components/popup/PopupOrder.vue'
import PopupAlign from '@/components/popup/PopupAlign.vue'
import PopupLayer from '@/components/popup/PopupLayer.vue'
import PopupPage from '@/components/popup/PopupPage.vue'
import PopupFlip from '@/components/popup/PopupFlip.vue'
import PopupSlider from '@/components/popup/PopupSlider.vue'
import { mapActions, mapGetters } from 'vuex'
import { IPopupComponent } from '@/interfaces/popup'
import popupUtils from '@/utils/popupUtils'

export default Vue.extend({
  components: {
    PopupOrder,
    PopupLayer,
    PopupAlign,
    PopupPage,
    PopupFlip,
    PopupSlider
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      vcoConfig: {
        handler: () => {
          popupUtils.closePopup()
        },
        events: ['dblclick', 'click', 'contextmenu']
        // events: ['dblclick', 'click', 'contextmenu', 'mousedown']
      }
    }
  },
  computed: {
    ...mapGetters({
      isPopupOpen: 'popup/isPopupOpen',
      popupComponent: 'popup/getPopupComponent'
    }),
    component(): string {
      return (this.popupComponent as IPopupComponent).component
    }
  },
  methods: {
    ...mapActions({
      closePopup: 'popup/closePopup'
    }),
    async close() {
      await (this.popupComponent as IPopupComponent).closeHandler()
      this.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup {
  width: initial;
  height: initial;
  border-radius: 5px;
  position: absolute;
  left: 0;
  top: 0;
  z-index: setZindex("popup");
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
