<template lang="pug">
  div(class="property-bar px-5 py-10")
    slot
</template>

<script lang="ts">

import Vue from 'vue'

export default Vue.extend({

})
</script>

<style lang="scss" scoped>
.property-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid setColor(gray-4);
  border-radius: 3px;
}
</style>
