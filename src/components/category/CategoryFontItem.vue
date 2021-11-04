<template lang="pug">
  div(class="category-fonts pointer" draggable="false" @click="setFont()")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="`${host}/${item.id}/${preview}`"
        @error="handleNotFound")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="`${host}/${item.id}/${preview2}`"
        @error="handleNotFound")
    div(class="category-fonts__icon")
      svg-icon(v-if="props.font === item.id"
        iconName="done"
        iconColor="gray-2"
        iconWidth="25px")
      svg-icon(v-else-if="pending === item.id"
        iconName="loading"
        iconColor="gray-1"
        iconWidth="20px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import TextPropUtils from '@/utils/textPropUtils'
import StepsUtils from '@/utils/stepsUtils'
import { IFont } from '@/interfaces/text'
import AssetUtils from '@/utils/assetUtils'

export default Vue.extend({
  props: {
    host: String,
    preview: String,
    preview2: String,
    item: Object
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'fontStore', 'pending'])
  },
  methods: {
    ...mapMutations('text', {
      updateState: 'UPDATE_STATE'
    }),
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    setFont() {
      const fontStore = this.fontStore as Array<IFont>
      if (!this.pending && !fontStore.some(font => font.face === this.item.id)) {
        this.updateState({ pending: this.item.id })
        const newFont = new FontFace(this.item.id, this.getFontUrl(this.item.id))
        const promise = () => {
          return new Promise<void>((resolve) => {
            newFont.load().then(newFont => {
              document.fonts.add(newFont)
              TextUtils.updateFontFace({ name: newFont.family, face: newFont.family })

              TextPropUtils.onPropertyClick('fontFamily', this.item.id, this.sel.start, this.sel.end)
              TextPropUtils.updateTextPropsState({ font: this.item.id })
              AssetUtils.addAssetToRecentlyUsed(this.item)

              StepsUtils.record()
              this.updateState({ pending: '' })
              resolve()
            })
          })
        }
        promise()
      }
    },
    getFontUrl(fontID: string): string {
      console.log(fontID)
      return `url("https://template.vivipic.com/font/${fontID}/font")`
    }
  }
})
</script>

<style lang="scss" scoped>
  .category-fonts {
    display: grid;
    grid-template-columns: 7fr 4fr 1fr;
    grid-gap: 10px;
    &__item-wrapper {
      overflow: hidden;
      position: relative;
      text-align: left;
    }
    &__item {
    height: 25px;
    object-fit: contain;
    }
    &__icon {
      position: absolute;
      right: 0;
    }
  }
</style>

function mapMutation(arg0: string, arg1: string[]): any {
  throw new Error('Function not implemented.')
}
