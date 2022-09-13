<template lang="pug">
  div(class="font-tag__container")
    div(class="font-tag__tag-wrapper pointer" v-for="tag in tags"
      @click="onClick")
      div(class="font-tag__tag") {{ tag }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  created() {
    if (this.tags.length === 0) {
      this.addFontTags()
    }
  },
  computed: {
    ...mapState('fontTag', ['tags'])
  },
  methods: {
    ...mapActions('fontTag', {
      addFontTags: 'ADD_FONT_TAGS'
    }),
    onClick() {
      console.log('on click')
    }
  }
})
</script>

<style lang="scss" scoped>
.font-tag {
  &__container {
    display: flex;
    flex-wrap: wrap;
  }
  &__tag-wrapper {
    padding: 8px;
    border-radius: 12px;
    border: 1px solid #E0E0E0;
    margin: 5px
  }
}
</style>
