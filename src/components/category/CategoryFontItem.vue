<template lang="pug">
  img(class="pointer"
    :src="src"
    style="object-fit: contain;"
    @click="setFont()"
    @error="handleNotFound")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { IText } from '@/interfaces/layer'
import TextPropUtils from '@/utils/textPropUtils'
import { IFont } from '@/interfaces/text'

export default Vue.extend({
  props: {
    src: String,
    objectId: String
  },
  components: {},
  computed: {
    ...mapState('text', ['sel', 'props', 'fontStore']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      scaleRatio: 'getPageScaleRatio',
      getJson: 'getJson'
    })
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    async setFont() {
      const fontStore = this.fontStore as Array<IFont>
      console.log(this.objectId)
      if (!fontStore.some(font => font.face === this.objectId)) {
        const newFont = new FontFace(this.objectId, this.getFontUrl(this.objectId))
        await newFont.load().then(newFont => {
          document.fonts.add(newFont)
          TextUtils.updateFontFace({ name: newFont.family, face: newFont.family })
        })
      }
      TextPropUtils.onPropertyClick('fontFamily', this.objectId, this.sel.start, this.sel.end)
      // TextPropUtils.updateTextPropsState({ font: font.name })
    },
    addText() {
      const json = this.getJson(this.objectId) as IText
      Object.assign(json.styles, { x: undefined, y: undefined })
      Object.assign(json, { editing: false })
      switch (json.type) {
        case 'text':
          return TextUtils.addText(json)
        case 'group':
          return TextUtils.addGroup(json)
        default:
          return null
      }
    },
    getFontUrl(fontID: string): string {
      return `url("https://template.vivipic.com/font/${fontID}/font")`
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
