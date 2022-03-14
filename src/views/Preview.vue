<template lang="pug">
  page-content(v-if="pages.length > 0" :config="pages[0]" :pageIndex="0")
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
    })
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
