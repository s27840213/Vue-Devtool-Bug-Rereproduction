<template lang="pug">
div(class="panel-bleed text-left")
  span(class="subtitle-2 text-gray-2") {{$t('NN0780')}}
  div(class="panel-bleed__content")
    bleed-settings(:page="currPage")
</template>

<script lang="ts">
import BleedSettings from '@/components/editor/BleedSettings.vue'
import { IPage } from '@/interfaces/page'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  components: {
    BleedSettings
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-bleed {
  &__content {
    margin-top: 16px;
  }
}
</style>
