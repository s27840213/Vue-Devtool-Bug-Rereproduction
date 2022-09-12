<template lang="pug">
  div
</template>

<script lang="ts">
import Vue from 'vue'
import fontTagUtils from '@/utils/fontTagUtils'

export default Vue.extend({
  created() {
    fontTagUtils.getFontTags()
      .then(data => {
        console.log(data)
      })
  }
})
</script>

<style lang="scss" scoped>
</style>
