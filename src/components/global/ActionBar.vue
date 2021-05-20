<template lang="pug">
  div(class="action-bar bg-gray-6 p-15")
    slot
</template>

<script lang="ts">

import Vue from 'vue'

export default Vue.extend({

})
</script>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  align-items: center;
}
</style>
