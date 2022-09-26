<template lang="pug">
div(class="preview")
  page-content(v-if="pages.length > 0" :config="pages[0]" :pageIndex="0")
  span(v-if="host" class="preview__host") {{host}}
</template>

<script lang="ts">
import Vue from 'vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import { mapGetters } from 'vuex'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  name: 'Preview',
  components: {
    PageContent
  },
  data() {
    return {}
  },
  computed: {
    ...mapGetters({
      pages: 'getPages'
    }),
    host(): string {
      const host = window.location.host
      const subdomain = host.match(/(.+).vivipic.com/)
      if (host === 'test.vivipic.com') return ''
      else if (host === 'localhost:8080') return 'local'
      else if (subdomain) return subdomain[1]
      else return host
    }
  },
  mounted() {
    const type = this.$router.currentRoute.query.type
    const designId = this.$router.currentRoute.query.design_id
    const teamId = this.$router.currentRoute.query.team_id
    if (!type || !designId || !teamId) {
      uploadUtils.isGettingDesign = false
    }
  }
})
</script>

<style lang="scss" scoped>
.preview{
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
