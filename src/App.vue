<template lang="pug">
  div(id="app")
    //- div(class="coordinate" ref="coordinate")
    //-   div(class="coordinate__val coordinate__width")
    //-     span {{coordinateWidth}}px
    //-   div(class="coordinate__val coordinate__height")
    //-     span {{coordinateHeight}}px
    router-view
    div(class="popup-area")
      dropdowns-order(v-show="isOrderDropdownsOpened"
        :type="'order'"
        @blur.native="setIsOrderDropdownsOpened(false)"
        tabindex="0")
      dropdowns-layer(v-show="isLayerDropdownsOpened"
        @blur.native="setIsLayerDropdownsOpened(false)"
        @click.native="setIsLayerDropdownsOpened(false)"
        tabindex="0")
      dropdowns-page(v-show="isPageDropdownsOpened"
        @blur.native="setIsPageDropdownsOpened(false)"
        @click.native="setIsPageDropdownsOpened(false)"
        tabindex="0")
      photo-info(v-show="currSelectedPhotoInfo.userName"
        :info="currSelectedPhotoInfo"
        @blur.native="setCurrSelectedPhotoInfo()"
        tabindex="0")
    div(class="modal-container"
        v-if="isModalOpen")
      modal-card
    notifications(group="copy"
      position="top center"
      width="300px"
      :max="2"
      :duration="2000")
      template(v-slot:body="{ item }")
        div(class="copy-notification"
          v-html="item.text")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import DropdownsOrder from '@/components//dropdowns/DropdownsOrder.vue'
import DropdownsLayer from '@/components/dropdowns/DropdownsLayer.vue'
import DropdownsPage from '@/components/dropdowns/DropdownsPage.vue'
import { Chrome } from 'vue-color'
import ColorPicker from '@/components/ColorPicker.vue'
import PhotoInfo from '@/components/modal/PhotoInfo.vue'
import ModalCard from '@/components/modal/ModalCard.vue'

export default Vue.extend({
  components: {
    DropdownsOrder,
    DropdownsLayer,
    DropdownsPage,
    'chrome-picker': Chrome,
    ColorPicker,
    PhotoInfo,
    ModalCard
  },
  data() {
    return {
      coordinate: null as unknown as HTMLElement,
      coordinateWidth: 0,
      coordinateHeight: 0
    }
  },
  mounted() {
    this.coordinate = this.$refs.coordinate as HTMLElement
  },
  computed: {
    ...mapGetters({
      getLastSelectedPageIndex: 'getLastSelectedPageIndex',
      isOrderDropdownsOpened: 'getIsOrderDropdownsOpened',
      isLayerDropdownsOpened: 'getIsLayerDropdownsOpened',
      isPageDropdownsOpened: 'getIsPageDropdownsOpened',
      isColorPickerOpened: 'getIsColorPickerOpened',
      currSelectedPhotoInfo: 'getCurrSelectedPhotoInfo',
      isModalOpen: 'modal/getModalOpen'
    })
  },
  methods: {
    ...mapMutations({
      _setIsOrderDropdownsOpened: 'SET_isOrderDropdownsOpened',
      _setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened',
      _setIsPageDropdownsOpened: 'SET_isPageDropdownsOpened',
      _setIsColorPickerOpened: 'SET_isColorPickerOpened',
      _setCurrSelectedPhotoInfo: 'SET_currSelectedPhotoInfo'
    }),
    coordinateHandler(e: MouseEvent) {
      this.coordinateWidth = e.clientX
      this.coordinateHeight = e.clientY
      this.coordinate.style.width = `${this.coordinateWidth}px`
      this.coordinate.style.height = `${this.coordinateHeight}px`
    },
    setIsOrderDropdownsOpened(isOpened: boolean) {
      this.$nextTick(() => {
        this._setIsOrderDropdownsOpened(isOpened)
      })
    },
    setIsLayerDropdownsOpened(isOpened: boolean) {
      this.$nextTick(() => {
        this._setIsLayerDropdownsOpened(isOpened)
      })
    },
    setIsPageDropdownsOpened(isOpened: boolean) {
      this.$nextTick(() => {
        this._setIsPageDropdownsOpened(isOpened)
      })
    },
    setIsColorPickerOpened(isOpened: boolean) {
      this.$nextTick(() => {
        this._setIsColorPickerOpened(isOpened)
      })
    },
    setCurrSelectedPhotoInfo() {
      this.$nextTick(() => {
        this._setCurrSelectedPhotoInfo({})
      })
    }
  }
})
</script>
<style lang="scss">
#app {
  @include size(100%, 100%);
  position: relative;
  max-height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  overflow: hidden;
  user-select: none;
}

// Debug used class, won't be released in production
.coordinate {
  border-right: 1px solid red;
  border-bottom: 1px solid red;
  opacity: 0.5;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: setZindex(coordinate);
  &__val {
    position: absolute;
    color: red;
  }

  &__width {
    bottom: 5px;
    left: 50%;

    transform: translate(0, -50%);
  }
  &__height {
    top: 50%;
    right: 5px;
    transform: translate(-50%, 0);
  }
}
.popup-area {
  @include size(100%, 100%);
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  z-index: setZindex(dropdowns);
  pointer-events: none;
  > div {
    pointer-events: initial;
  }
}

.modal-container {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: setColor(gray-2, 0.6);
  z-index: 999;
}

.copy-notification {
  padding: 5px;
  text-align: center;
  color: setColor(white);
  background-color: setColor(blue-2);
  margin: 5px 5px 0 0;
  border-radius: 5px;
}

// .vc-chrome-toggle-btn {
//   display: none;
// }
</style>
