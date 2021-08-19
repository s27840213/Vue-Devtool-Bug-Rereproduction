<template lang="pug">
  img(class="pointer"
    :src="src"
    draggable="false"
    @click="addBackground"
    @error="handleNotFound")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    src: String,
    objectId: String
  },
  components: {},
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      getJson: 'getJson'
    })
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    addBackground(event: Event) {
      const { src } = event.target as HTMLImageElement
      this.$store.commit(
        'SET_backgroundImageSrc',
        { pageIndex: this.lastSelectedPageIndex, imageSrc: src }
      )
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
