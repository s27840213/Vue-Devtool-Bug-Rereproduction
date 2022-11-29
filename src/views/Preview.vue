<template lang="pug">
div(class="preview" :style="containStyles")
  page-content(v-if="pages.length > 0" :config="pages[0]" :pageIndex="0" :contentScaleRatio="contentScaleRatio" :forceRender="true")
  span(v-if="host" class="preview__host") {{host}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import { mapGetters, mapState, mapMutations } from 'vuex'
import uploadUtils from '@/utils/uploadUtils'

export default defineComponent({
  name: 'Preview',
  components: {
    PageContent
  },
  data() {
    return {}
  },
  computed: {
    ...mapState({
      contentScaleRatio: 'defaultContentScaleRatio'
    }),
    ...mapGetters({
      pages: 'getPages'
    }),
    host(): string {
      const host = window.location.host
      const subdomain = host.match(/(.+).vivipic.com/)
      const urlParams = new URLSearchParams(window.location.search)

      if (host === 'test.vivipic.com' || urlParams.has('hideHostLabel')) return ''
      else if (host === 'localhost:8080') return 'local'
      else if (subdomain) return subdomain[1]
      else return host
    },
    containStyles(): any {
      return {
        transform: `scale(${1 / this.contentScaleRatio})`
      }
    }
  },
  methods: {
    ...mapMutations({
      setInScreenshotPreview: 'SET_inScreenshotPreview'
    })
  },
  mounted() {
    const type = this.$router.currentRoute.value.query.type
    const designId = this.$router.currentRoute.value.query.design_id
    const teamId = this.$router.currentRoute.value.query.team_id
    if (!type || !designId || !teamId) {
      uploadUtils.isGettingDesign = false
    }

    this.setInScreenshotPreview(true)
  },
  beforeUnmount() {
    this.setInScreenshotPreview(false)
  }
})
</script>

<style lang="scss" scoped>
.preview {
  position: relative;
  &__host {
    @include body-LG;
    position: absolute;
    top: 0;
    left: 0;
    color: black;
    background-color: setColor(white);
  }
}
</style>
