<template lang="pug">
  div(id="app")
    //- div(class="coordinate" ref="coordinate")
    //-   div(class="coordinate__val coordinate__width")
    //-     span {{coordinateWidth}}px
    //-   div(class="coordinate__val coordinate__height")
    //-     span {{coordinateHeight}}px
    router-view
    div(class="popup-area")
      popup
      photo-info(v-show="currSelectedPhotoInfo.userName"
        :info="currSelectedPhotoInfo"
        @blur.native="setCurrSelectedPhotoInfo()"
        tabindex="0")
      hint
    div(class="modal-container"
        v-if="isModalOpen")
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
import { mapGetters, mapMutations, mapActions } from 'vuex'
import vClickOutside from 'v-click-outside'
import Popup from '@/components/popup/Popup.vue'
import { Chrome } from 'vue-color'
import PhotoInfo from '@/components/modal/PhotoInfo.vue'
import ModalCard from '@/components/modal/ModalCard.vue'
import popupUtils from './utils/popupUtils'
import localeUtils from './utils/localeUtils'

export default Vue.extend({
  components: {
    Popup,
    'chrome-picker': Chrome,
    PhotoInfo,
    ModalCard
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
  async created() {
    const defaultFonts: Array<Promise<void>> = []

    await fetch('https://template.vivipic.com/static/app.json')
      .then(response => response.json())
      .then(json => {
        this.$store.commit('user/SET_STATE', {
          verUni: json.ver_uni,
          imgSizeMap: json.image_size_map
        })

        Object.entries(json)
          .forEach(([k, v]) => {
            if (['tw_default', 'jp_default', 'us_default', 'emoji'].includes(k)) {
              const { priority, id, ver } = v as { id: string, ver: number, priority: number }
              const font = {
                type: 'public',
                face: id,
                url: '',
                ver
              }
              this.updateDefaultFonts({ priority, font })
              defaultFonts.push(this.addFont(font))
            }
          })
        Promise.all(defaultFonts)
      })
      .catch(e => console.error(e))
  },
  mounted() {
    this.coordinate = this.$refs.coordinate as HTMLElement
  },
  computed: {
    ...mapGetters({
      getLastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedPhotoInfo: 'getCurrSelectedPhotoInfo',
      isModalOpen: 'modal/getModalOpen'
    }),
    currLocale(): string {
      return localeUtils.currLocale()
    }
  },
  watch: {
    currLocale() {
      console.log(this.$route.path)
    }
  },
  methods: {
    ...mapActions('text', ['addFont']),
    ...mapMutations('text', {
      updateDefaultFonts: 'UPDATE_DEFAULT_FONT'
    }),
    ...mapMutations({
      setDropdown: 'popup/SET_STATE',
      _setCurrSelectedPhotoInfo: 'SET_currSelectedPhotoInfo'
    }),
    coordinateHandler(e: MouseEvent) {
      this.coordinateWidth = e.clientX
      this.coordinateHeight = e.clientY
      this.coordinate.style.width = `${this.coordinateWidth}px`
      this.coordinate.style.height = `${this.coordinateHeight}px`
    },
    closeDropdown(type: string) {
      popupUtils.closePopup()
    },
    setCurrSelectedPhotoInfo() {
      this.$nextTick(() => {
        this._setCurrSelectedPhotoInfo({})
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
