<template lang="pug">
div(class="panel-bleed text-left")
  span(class="subtitle-2 text-gray-2") {{$t('NN0780')}}
  div(class="panel-bleed__content")
    bleed-settings
</template>

<script lang="ts">
import BleedSettings from '@/components/editor/BleedSettings.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    BleedSettings
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
