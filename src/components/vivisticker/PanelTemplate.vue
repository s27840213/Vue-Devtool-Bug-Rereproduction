<template lang="pug">
div(class="panel-template rwd-container")
  tabs(v-if="!isInCategory && !isInGroupTemplate"
      class="panel-template__tabs"
      :tabs="[$t('STK0005'), $t('STK0063')]"
      v-model="tabIndex")
  keep-alive
    panel-template-content(v-if="isStory" initIgLayout="story" ref='story')
  keep-alive
    panel-template-content(v-if="isPost" initIgLayout="post" ref='post')
</template>

<script lang="ts">
import { CCategoryList } from '@/components/category/CategoryList.vue'
import Tabs from '@/components/Tabs.vue'
import PanelTemplateContent from '@/components/vivisticker/PanelTemplateContent.vue'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

enum TABS {
  STORY = 0,
  POST = 1
}

export default defineComponent({
  name: 'panel-template',
  components: {
    Tabs,
    PanelTemplateContent
  },
  data() {
    return {
      tabIndex: 0,
    }
  },
  mounted() {
    eventUtils.on(PanelEvent.scrollPanelTemplateToTop, this.scrollToTop)
  },
  beforeUnmount() {
    eventUtils.off(PanelEvent.scrollPanelTemplateToTop)
  },
  computed: {
    ...mapGetters({
      isTabInCategory: 'vivisticker/getIsInCategory',
      isInGroupTemplate: 'vivisticker/getIsInGroupTemplate'
    }),

    isInCategory(): boolean {
      return this.isTabInCategory('template')
    },
    isStory(): boolean { return this.tabIndex === TABS.STORY },
    isPost(): boolean { return this.tabIndex === TABS.POST },
  },
  methods: {
    scrollToTop() {
      if (this.isStory) {
      // @ts-expect-error: Call vue child component method
        (this.$refs.story as CCategoryList[]).scrollToTop()
      } else {
      // @ts-expect-error: Call vue child component method
        (this.$refs.post as CCategoryList[]).scrollToTop()
      }
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-template {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto auto 1fr;
  overflow: hidden;
  &__tabs {
    margin: 24px 0;
  }
}
</style>
