<template lang="pug">
  div(id="app" :style="appStyles()")
    link(rel="preconnect" href="https://fonts.googleapis.com")
    link(rel="preconnect" href="https://fonts.gstatic.com" crossorigin)
    link(href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet")
    link(href='https://fonts.googleapis.com/css?family=Poppins:400,600,700' rel='stylesheet' type='text/css')
    //- div(class="coordinate" ref="coordinate")
    //-   div(class="coordinate__val coordinate__width")
    //-     span {{coordinateWidth}}px
    //-   div(class="coordinate__val coordinate__height")
    //-     span {{coordinateHeight}}px
    router-view
    div(class="popup-area")
      popup
      res-info(v-show="currSelectedResInfo.type"
        :info="currSelectedResInfo"
        @blur.native="setCurrSelectedResInfo()"
        tabindex="0")
    fps(v-if="!inScreenshotPreview && showAllAdminTool")
    div(class="modal-container"
        v-if="isModalOpen"
        :style="modalInfo.backdropStyle")
      modal-card
    notifications(group="copy"
      position="top center"
      width="300px"
      :max="2"
      :duration="2000")
      template(v-slot:body="{ item }")
        div(class="notification copy"
          v-html="item.text")
    notifications(group="error"
      position="top center"
      width="300px"
      :max="1"
      :duration="5000")
      template(v-slot:body="{ item }")
        div(class="notification error"
          v-html="item.text")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import Popup from '@/components/popup/Popup.vue'
import { Chrome } from 'vue-color'
import ResInfo from '@/components/modal/ResInfo.vue'
import ModalCard from '@/components/modal/ModalCard.vue'
import Fps from '@/components/componentLog/Fps.vue'
import popupUtils from './utils/popupUtils'
import localeUtils from './utils/localeUtils'
import networkUtils from './utils/networkUtils'

export default Vue.extend({
  components: {
    Popup,
    'chrome-picker': Chrome,
    ResInfo,
    ModalCard,
    Fps
  },
  directives: {
    clickOutside: vClickOutside.directive
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
  beforeMount() {
    networkUtils.registerNetworkListener()
  },
  beforeDestroy() {
    networkUtils.unregisterNetworkListener()
  },
  computed: {
    ...mapGetters({
      currSelectedResInfo: 'getCurrSelectedResInfo',
      isModalOpen: 'modal/getModalOpen',
      modalInfo: 'modal/getModalInfo',
      inScreenshotPreview: 'getInScreenshotPreview',
      showAllAdminTool: 'user/showAllAdminTool'
    }),
    currLocale(): string {
      return localeUtils.currLocale()
    }
  },
  methods: {
    ...mapMutations('text', {
      updateDefaultFonts: 'UPDATE_DEFAULT_FONT'
    }),
    ...mapMutations({
      setDropdown: 'popup/SET_STATE',
      _setCurrSelectedResInfo: 'SET_currSelectedResInfo'
    }),
    appStyles() {
      if (this.$route.name === 'Preview') {
        return {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          '-webkit-font-smoothing': 'antialiased',
          transformStyle: 'preserve-3d'
        }
      } else {
        if (this.currLocale === 'tw' || this.currLocale === 'jp') {
          return { fontFamily: 'NOTO SANS TC' }
        } else {
          return { fontFamily: 'Poppins' }
        }
      }
    },
    coordinateHandler(e: MouseEvent) {
      this.coordinateWidth = e.clientX
      this.coordinateHeight = e.clientY
      this.coordinate.style.width = `${this.coordinateWidth}px`
      this.coordinate.style.height = `${this.coordinateHeight}px`
    },
    closeDropdown(type: string) {
      popupUtils.closePopup()
    },
    setCurrSelectedResInfo() {
      this.$nextTick(() => {
        this._setCurrSelectedResInfo({})
      })
    },
    vcoConfig(type: string) {
      return {
        handler: () => {
          this.closeDropdown(type)
        },
        events: ['dblclick', 'click', 'contextmenu']
        // events: ['dblclick', 'click', 'contextmenu', 'mousedown']
      }
    }
  }
})
</script>
<style lang="scss">
@use "~@/assets/scss/main.scss";

#app {
  @include size(100%, 100%);
  position: relative;
  max-height: 100%;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  overflow: hidden;
  text-rendering: geometricPrecision;
  // block swipe navagation, only work for Chrome & FireFox
  overscroll-behavior-x: none;
  touch-action: none;
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
  z-index: setZindex(popup);
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
  background-color: setColor(gray-1, 0.3);
  z-index: 999;
}

.notification {
  padding: 5px;
  text-align: center;
  color: setColor(white);
  margin: 5px 5px 0 0;
  border-radius: 5px;
  &.copy {
    background-color: setColor(blue-2);
  }
  &.error {
    background-color: setColor(red-2);
  }
}
// .vc-chrome-toggle-btn {
//   display: none;
// }
</style>
