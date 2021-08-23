<template lang="pug">
  img(class="pointer"
    :src="src"
    style="object-fit: contain;"
    draggable="false"
    @click="setFont()"
    @error="handleNotFound")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
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
      getJson: 'getJson'
    })
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    async setFont() {
      const fontStore = this.fontStore as Array<IFont>
      if (!fontStore.some(font => font.face === this.objectId)) {
        const newFont = new FontFace(this.objectId, this.getFontUrl(this.objectId))
        await newFont.load().then(newFont => {
          document.fonts.add(newFont)
          TextUtils.updateFontFace({ name: newFont.family, face: newFont.family })
        })
      }
      TextPropUtils.onPropertyClick('fontFamily', this.objectId, this.sel.start, this.sel.end)
      TextPropUtils.updateTextPropsState({ font: this.objectId })
    },
    getFontUrl(fontID: string): string {
      return `url("https://template.vivipic.com/font/${fontID}/font")`
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
