<template lang="pug">
div(class="panel-bg-remove")
  //- nubtn(size="mid-full") {{$t('NN0014')}}
</template>

<script lang="ts">
import Nubtn from '@/components/global/Nubtn.vue'
import { defineComponent } from 'vue'
export default defineComponent({
  emits: [],
  components: {
    Nubtn
  }
})
</script>

<style lang="scss" scoped>
.panel-resize {
  height: 100%;
}
</style>
