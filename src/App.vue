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

export default Vue.extend({
  components: {
    DropdownsOrder,
    DropdownsLayer,
    DropdownsPage,
    'chrome-picker': Chrome,
    ColorPicker,
    PhotoInfo
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
    fetch('https://d28vpyd7xcfiwl.cloudfront.net/NuVCei56OafX/edit/temp.json?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9kMjh2cHlkN3hjZml3bC5jbG91ZGZyb250Lm5ldC9OdVZDZWk1Nk9hZlgvKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTYyNjgyNDI0ODE0MH19fV19&Key-Pair-Id=KEUNR6VVD9BE6&Signature=LLRBIP6M28S-3M834il0LBWSgFFZstzmiOtXGxGi0UOYWN~5BCVrCTMW5KQBpuNs595vXnn27QO6svNN8YbgYVT4odxVb6IOgChZ31t9DLHOFEvukti7pRfVN5tr4QDywuc~zTzkbCm1tafPQs5FQZO9zsxAwJ3bMi7jrXi6kAUGWflq52VB6lmMq1AaiGKyAcaRvuMia1C0yVEZ8yS~GUI4fr7NROkht6mAxU6Lh0W1Bp-o7jtfXw7gsREsJbvGAKG1Msw~b1riWMw7L-yJ~v7vpDsggqZ97-qwZ36DRkt-N2BEARdqKAJKZn7MjYsF-Z4f3SlN4ksrof3lNiiPtg__')
      .then((response) => {
        return response.json()
      })
      .then((myJson) => {
        this.$store.commit('SET_pages', myJson)
      })
    /*
    fetch('https://template.vivipic.com/svg/file.json')
      .then((response) => {
        return response.json()
      })
      .then((myJson) => {
        this.$store.commit('SET_pages', myJson)
      })
    */
  },
  computed: {
    ...mapGetters({
      getLastSelectedPageIndex: 'getLastSelectedPageIndex',
      isOrderDropdownsOpened: 'getIsOrderDropdownsOpened',
      isLayerDropdownsOpened: 'getIsLayerDropdownsOpened',
      isPageDropdownsOpened: 'getIsPageDropdownsOpened',
      isColorPickerOpened: 'getIsColorPickerOpened',
      currSelectedPhotoInfo: 'getCurrSelectedPhotoInfo'
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

// .vc-chrome-toggle-btn {
//   display: none;
// }
</style>
