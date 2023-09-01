<template lang="pug">
div(class="page-preview" :style="styles()")
  div(class="page-preview__container" ref="preview")
    div(class="page-preview__page-item" v-for="(page, index) in pagesState" :key="`page-preview-page-${page.config.id}`")
      page-content(class="page-preview__page-item__page"
      :config="page.config"
      :pageIndex="index"
      :contentScaleRatio="previewScale"
      :inPreview="true"
      :style="pageStyles()")
      div(class="page-preview__page-item__index text-black-4") {{ index + 1 }}
      div(class="page-preview__cover" @click.prevent.stop="handlePageClick(index)")
    div(class="page-preview__placeholder")
</template>

<script lang="ts">
import PageContent from '@/components/editor/page/PageContent.vue'
import { IPageState } from '@/interfaces/page'
import editorUtils from '@/utils/editorUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  components: {
    PageContent
  },
  props: {
    pagesState: {
      type: Object as PropType<IPageState[]>,
      required: true
    }
  },
  data() {
    return {
      previewScale: 1
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.handleResize()
    })
  },
  watch: {
    windowSize: {
      handler(): void {
        this.$nextTick(() => {
          this.handleResize()
        })
      },
      deep: true
    },
    isInMultiPageShare(newVal) {
      this.$nextTick(() => {
        this.handleResize()
      })
    }
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize',
      isLandscape: 'isLandscape'
    }),
    ...mapState('vivisticker', {
      templateShareType: 'templateShareType',
      isInMultiPageShare: 'isInMultiPageShare',
    }),
    ...mapState('templates', {
      igLayout: 'igLayout',
    }),
    ...mapGetters({
      pagesLength: 'getPagesLength',
      currFocusPageIndex: 'getCurrFocusPageIndex',
      editorType: 'vivisticker/getEditorType',
    }),
    pageSize(): {width: number, height: number} {
      return this.pagesState[0].config
    }
  },
  methods: {
    ...mapMutations({
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setIsInMultiPageShare: 'vivisticker/SET_isInMultiPageShare',
      setIsInPagePreview: 'vivisticker/SET_isInPagePreview',
    }),
    styles() {
      return {
        padding: `0 ${this.isLandscape ? 28 : 10}%`
      }
    },
    pageStyles(): {[key: string]: string} {
      return {
        width: `${this.pageSize.width * this.previewScale}px`,
        height: `${this.pageSize.height * this.previewScale}px`,
      }
    },
    handleResize() {
      const elPreview = this.$refs.preview as HTMLElement
      if (!elPreview) return
      this.previewScale = (elPreview.clientWidth - 48) / this.pageSize.width / 2
    },
    handlePageClick(pageIndex: number) {
      this.setCurrActivePageIndex(pageIndex)
      this.$nextTick(() => { vivistickerUtils.scrollIntoPage(pageIndex, 300) })
      this.setIsInPagePreview(false)
      editorUtils.setShowMobilePanel(false)
    }
  }
})
</script>

<style lang="scss" scoped>
.page-preview {
  @include size(100%);
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background-color: setColor(black-1);
  padding: 0 10%;
  &__container {
    @include no-scrollbar;
    height: 100%;
    justify-content: center;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 16px;
    margin-top: 40px;
    overflow-y: auto;
  }
  &__page-item {
    position: relative;
    padding: 0px 8px 16px 8px;
    &__page {
      border-radius: 10px;
      filter: drop-shadow(0px 0px 8px rgba(60, 60, 60, 0.31));
    }
    &__index {
      margin-top: 16px;
      font-weight: 600;
      font-size: 16px;
      line-height: 28px;
    }
  }
  &__cover {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
  &__placeholder {
    height: 72px;
    grid-column: span 2;
  }
}
</style>
