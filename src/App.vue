<template lang="pug">
metainfo
  template(v-slot:title ="{ content }") {{ content ? `${content}` : `SITE_NAME` }}
div(id="app" :style="appStyles()")
  link(rel="preconnect" href="https://fonts.googleapis.com")
  link(rel="preconnect" href="https://fonts.gstatic.com" crossorigin="")
  link(href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet")
  link(href='https://fonts.googleapis.com/css?family=Poppins:400,600,700' rel='stylesheet' type='text/css')
  div(class="main-content")
    div(class="main-content__router-view")
      router-view
    home-footer-tabs(v-if="showHomeFooterTabs")
  div(class="popup-area")
    popup
    res-info(v-show="currSelectedResInfo.type"
      :info="currSelectedResInfo"
      @blur="setCurrSelectedResInfo()"
      tabindex="0")
  debug-tool(v-if="!inScreenshotPreview && showAllAdminTool")
  div(class="modal-container"
      v-if="isModalOpen")
    modal-card
  notifications(group="copy"
    position="top center"
    :style="notificationStyles()"
    width="300px"
    :max="2"
    :duration="2000")
    template(v-slot:body="{ item }")
      div(class="notification copy"
        v-html="item.text")
  notifications(group="error"
    position="top center"
    :style="notificationStyles()"
    width="300px"
    :max="1"
    :duration="5000")
    template(v-slot:body="{ item }")
      div(class="notification error"
        v-html="item.text")
</template>

<script lang="ts">
import DebugTool from '@/components/componentLog/DebugTool.vue'
import HomeFooterTabs from '@/components/homepage/HomeFooterTabs.vue'
import ModalCard from '@/components/modal/ModalCard.vue'
import ResInfo from '@/components/modal/ResInfo.vue'
import Popup from '@/components/popup/Popup.vue'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import localeUtils from './utils/localeUtils'
import networkUtils from './utils/networkUtils'
import picWVUtils from './utils/picWVUtils'

export default defineComponent({
  emits: [],
  components: {
    Popup,
    ResInfo,
    ModalCard,
    DebugTool,
    HomeFooterTabs,
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      coordinate: null as unknown as HTMLElement,
    }
  },
  mounted() {
    this.coordinate = this.$refs.coordinate as HTMLElement

    if ((window as any).__PRERENDER_INJECTED !== undefined) {
      document.dispatchEvent(new Event('render-event'))
      window.dispatchEvent(new Event('render-event'))
    }

    if (!picWVUtils.inBrowserMode) {
      picWVUtils.registerCallbacks('main')
    }

    this.$router.isReady().then(() => { picWVUtils.sendAppLoaded() })
  },
  beforeMount() {
    networkUtils.registerNetworkListener()
    // Overwrite overflow clip for localhost text debug use
    if (/http:/.test(window.location.href)) {
      document.body.style.overflow = 'hidden'
    }
  },
  beforeUnmount() {
    networkUtils.unregisterNetworkListener()
  },
  computed: {
    ...mapGetters({
      currSelectedResInfo: 'getCurrSelectedResInfo',
      isModalOpen: 'modal/getModalOpen',
      inScreenshotPreview: 'getInScreenshotPreview',
      showAllAdminTool: 'user/showAllAdminTool',
      userInfo: picWVUtils.appendModuleName('getUserInfo'),
      browserInfo: 'user/getBrowserInfo'
    }),
    currLocale(): string {
      return localeUtils.currLocale()
    },
    showHomeFooterTabs (): boolean {
      return ['Home', 'TemplateCenter', 'MyDesign', 'Settings'].includes(this.$route.name as string) && this.$isTouchDevice()
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
    appStyles(): Record<string, string> {
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
    setCurrSelectedResInfo() {
      this.$nextTick(() => {
        this._setCurrSelectedResInfo({})
      })
    },
    notificationStyles() {
      return {
        margin: this.$isTouchDevice() ? `${48 + this.userInfo.statusBarHeight}px 5px 0 0` : '',
        fontSize: this.$isTouchDevice() ? '12px' : '16px'
      }
    }
  }
})
</script>
<style lang="scss">
@use "@/assets/scss/main.scss";

#app{
  @include size(100%, 100%);
  position: relative;
  max-height: 100%;
  user-select: none;
  -webkit-user-select: none;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  overflow: hidden;
  text-rendering: geometricPrecision;
  // block swipe navagation, only work for Chrome & FireFox
  overscroll-behavior-x: none;
  touch-action: none;
}

.main-content {
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: minmax(0, 1fr);

  &__router-view {
    height: 100%;
    max-height: 100%;
    overflow: scroll;
    @include no-scrollbar;
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
  background-color: setColor(gray-2, 0.6);
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
