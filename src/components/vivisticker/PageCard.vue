<template lang="pug">
div(class="page-card" :id="`page-card-${pageIndex}`" :style="styles('card')")
  div(v-if="!isOutOfBound" :id="`nu-page-wrapper_${pageIndex}`" :class="`page-card__pseudo-page`" :style="styles('page')")
    div(class="page-card__scale-container" :style="styles('scale')")
      page-content(:id="`vvstk-page-${pageIndex}`" class="page-content" :config="config" :pageIndex="pageIndex" :noBg="noBg" :contentScaleRatio="contentScaleRatio" :snapUtils="snapUtils")
      dim-background(v-if="imgControlPageIdx === pageIndex" :config="config" :contentScaleRatio="contentScaleRatio")
    div(class="page-control" :style="styles('control')")
      nu-controller(v-if="currFocusPageIndex === pageIndex && currLayer.type" data-identifier="controller"
        :key="`controller-${currLayer.id}`"
        :layerIndex="currSelectedIndex"
        :pageIndex="pageIndex"
        :page="config"
        :config="currLayer"
        :snapUtils="snapUtils"
        :contentScaleRatio="contentScaleRatio")
</template>

<script lang="ts">
import DimBackground from '@/components/editor/page/DimBackground.vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import { ILayer } from '@/interfaces/layer'
import { IPage, IPageState } from '@/interfaces/page'
import backgroundUtils from '@/utils/backgroundUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import SnapUtils from '@/utils/snapUtils'
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  props: {
    pageIndex: {
      type: Number,
      required: true
    },
    cardWidth: {
      type: Number,
      required: true
    },
    cardHeight: {
      type: Number,
      required: true
    },
    marginTop: {
      type: Number,
      required: true
    },
    pageState: {
      type: Object as PropType<IPageState>,
      required: true
    },
    noBg: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
    }
  },
  created() {
    this.updateSnapUtilsIndex(this.pageIndex)
  },
  mounted() {
    // console.warn('mounted')
    // editorUtils.handleContentScaleRatio(this.pageIndex)
  },
  watch: {
    pageIndex(val) {
      this.updateSnapUtilsIndex(val)
    },
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize'
    }),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      getMiddlemostPageIndex: 'getMiddlemostPageIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer',
      editorBg: 'vivisticker/getEditorBg',
      editorType: 'vivisticker/getEditorType',
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      contentScaleRatio: 'getContentScaleRatio',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      isImgCtrl: 'imgControl/isImgCtrl',
      isBgImgCtrl: 'imgControl/isBgImgCtrl'
    }),
    config(): IPage {
      return this.pageState.config
    },
    snapUtils(): SnapUtils {
      return this.pageState.modules.snapUtils
    },
    currLayer(): ILayer {
      return layerUtils.getCurrLayer
    },
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    },
    selectedLayerCount(): number {
      return this.currSelectedInfo.layers.length
    },
    isPageDuringCopy(): boolean {
      return this.isDuringCopy && this.pageIndex === pageUtils.currFocusPageIndex
    },
    isOutOfBound(): boolean {
      return this.pageIndex <= pageUtils.currFocusPageIndex - 2 || this.pageIndex >= pageUtils.currFocusPageIndex + 2
    }
  },
  components: {
    PageContent,
    DimBackground
  },
  methods: {
    ...mapMutations({
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      updateSnapUtilsIndex: 'UPDATE_snapUtilsIndex'
    }),
    styles(type: string) {
      switch (type) {
        case 'card':
          return {
            width: `${this.cardWidth}px`,
            height: `${this.cardHeight}px`,
          }
        case 'control':
          return {
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            overflow: this.selectedLayerCount > 0 ? 'initial' : 'hidden'
          }
        case 'page':
          return {
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            backgroundColor: this.isPageDuringCopy ? 'transparent' : this.editorBg,
            marginTop: `${this.marginTop}px`,
            ...(this.isPageDuringCopy ? { boxShadow: '0 0 0 2000px #1f1f1f', borderRadius: '0' } : {}),
            ...(backgroundUtils.inBgSettingMode && { boxShadow: '0 0 0 2px #7190CC' })
          }
        case 'scale':
          return {
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            transform: `scale(${1 / this.contentScaleRatio})`
          }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.page-card {
  @include size(100%);
  &__pseudo-page {
    position: relative;
    transform-style: preserve-3d;
    user-select: none;
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    border-radius: 10px;
    margin: 0 auto;
  }
  &__scale-container {
    width: 0px;
    height: 0px;
    position: relative;
    box-sizing: border-box;
    transform-origin: 0 0;
  }
}

.page-content {
  overflow: hidden;
  border-radius: v-bind("isDuringCopy ? '0' : '10px'");
}

.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  transform-style: preserve-3d;
  // this css property will prevent the page-control div from blocking all the event of page-content
  pointer-events: none;
  :focus {
    outline: none;
  }
}
</style>
