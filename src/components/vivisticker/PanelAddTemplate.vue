<template lang="pug">
div(class="panel-add-template")
  div(class="panel-add-template__title caption-LG text-white") Choose a background
  div(class="panel-add-template__content btn-SM text-white")
    div(class="panel-add-template__item" @click="addTemplate(true)")
      div(class="panel-add-template__bg")
        svg-icon(iconName="apple_photos"
          iconWidth="32px")
      div(class="panel-add-template__text") Photo
    div(class="panel-add-template__item" @click="addTemplate()")
      div(class="panel-add-template__bg")
        svg-icon(iconName="add-page"
          iconWidth="32px"
          iconColor="white")
      div(class="panel-add-template__text") Blank
</template>

<script lang="ts">
import backgroundUtils from '@/utils/backgroundUtils'
import editorUtils from '@/utils/editorUtils'
import imageUtils from '@/utils/imageUtils'
import layerFactary from '@/utils/layerFactary'
import pageUtils from '@/utils/pageUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'

export default defineComponent({
  data() {
    return {
    }
  },
  props: {
  },
  computed: {
    ...mapState('templates', {
      igLayout: 'igLayout'
    }),
  },
  methods: {
    addTemplate(photo = false) {
      console.log('addTemplate', this.igLayout, photo)
      if (photo) {
        vivistickerUtils.getIosImg()
          .then(async (images: Array<string>) => {
            if (!images.length) return
            vivistickerUtils.startEditing(
              this.igLayout,
              { plan: 0, assetId: '' },
              async () => {
                console.log('start editing template', this.igLayout)
                return true
              },
              vivistickerUtils.getEmptyCallback()
            )
            imageUtils.imgLoadHandler(`vvstk://${images[0]}`, (img: HTMLImageElement) => {
              const { naturalWidth, naturalHeight } = img
              backgroundUtils.setBgImage({
                pageIndex: pageUtils.currFocusPageIndex,
                config: layerFactary.newImage({
                  srcObj: {
                    type: 'ios',
                    assetId: images[0],
                    userId: ''
                  },
                  styles: {
                    width: naturalWidth,
                    height: naturalHeight,
                    zindex: -1,
                    opacity: 100
                  }
                })
              })
              backgroundUtils.fitPageBackground(0)
            })
          })
      } else {
        vivistickerUtils.startEditing(
          this.igLayout,
          { plan: 0, assetId: '' },
          async () => {
            console.log('start editing template', this.igLayout)
            return true
          },
          vivistickerUtils.getEmptyCallback()
        )
      }
      editorUtils.setShowMobilePanel(false)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-add-template {
  padding-bottom: 30px;
  &__content {
    display: grid;
    grid-auto-flow: column;
    column-gap: 70px;
    justify-content: center;
    margin-top: 20px;
  }
  &__item {
    display: grid;
    row-gap: 10px;
  }
  &__bg {
    width: 72px;
    height: v-bind("igLayout === 'story' ? '128px' : '72px'");
    display: flex;
    background: #2E2E2E;
    border-radius: 5px;
    align-items: center;
    justify-content: center;
  }
}
</style>
