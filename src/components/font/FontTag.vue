<template lang="pug">
  div(class="font-tag")
    template(v-if="!isTouchDevice")
      div(:class="{'font-tag__container': !expand, 'font-tag__flex-container': true}")
        div(class="font-tag__tag-wrapper pointer" v-for="tag in tags"
          @click="onClick(tag)")
          div(class="font-tag__tag") {{ tag }}
      div(v-if="!expand" class="font-tag__more-wrapper")
        div(class="font-tag__more pointer"
          @click="onClickMore")
          div(class="font-tag__tag") {{ '...' }}
    template(v-else)
      div(class="font-tag__container-mobile")
        div(class="font-tag__flex-container-mobile")
          div(class="font-tag__tag-wrapper pointer" v-for="tag in tags"
            @click="onClick(tag)")
            div(class="font-tag__tag") {{ tag }}

</template>

<script lang="ts">
import generalUtils from '@/utils/generalUtils'
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'

export default Vue.extend({
  data() {
    return {
      expand: false
    }
  },
  created() {
    if (this.tags.length === 0) {
      this.addFontTags()
    }
  },
  computed: {
    ...mapState('fontTag', ['tags']),
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
    }
  },
  methods: {
    ...mapActions('fontTag', {
      addFontTags: 'ADD_FONT_TAGS'
    }),
    onClick(tag: string) {
      this.$emit('search', tag)
    },
    onClickMore() {
      this.expand = true
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
    &-mobile {
      overflow-x: scroll;
      @include no-scrollbar;
    }
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
    &-mobile {
      display: flex;
    }
  }
  &__tag {
    &-wrapper {
      flex-shrink: 0;
      padding: 8px;
      border-radius: 12px;
      border: 1px solid #E0E0E0;
      margin: 5px
    }
  }
}
</style>
