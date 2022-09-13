<template lang="pug">
  div(class="font-tag")
    div(:class="{'font-tag__container': !expand}")
      div(class="font-tag__flex-container")
        div(class="font-tag__tag-wrapper pointer" v-for="tag in tags"
          @click="onClick(tag)")
          div(class="font-tag__tag") {{ tag }}
    div(v-if="!expand" class="font-tag__more-wrapper")
      div(class="font-tag__more pointer"
        @click="onClick(more)")
        div(class="font-tag__tag") {{ '...' }}

</template>

<script lang="ts">
import generalUtils from '@/utils/generalUtils'
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'

export default Vue.extend({
  data() {
    const more = generalUtils.generateRandomString(6)
    return {
      expand: false,
      more
    }
  },
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
    onClick(tag: string) {
      if (tag === this.more) {
        this.expand = true
      } else {
        this.$emit('search', tag)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.font-tag {
  position: relative;
  &__container {
    overflow: hidden;
    max-height: 52px;
  }
  &__more {
    padding: 8px;
    margin: 5px;
    &-wrapper {
      position: absolute;
      padding: 0 0 0 10px;
      top: 0;
      right: 0;
      color: #4EABE6;
      background: white;
    }
  }
  &__flex-container {
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
