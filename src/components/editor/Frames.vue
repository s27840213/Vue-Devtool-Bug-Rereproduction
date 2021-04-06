<template lang="pug">
 div(class="frames bg-white")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({

})
</script>

<style lang="scss" scoped>
.frames {
  @include size(160px, 100%);
  box-shadow: -1px 0 4px setColor(blue-1, 0.05);
}
</style>
