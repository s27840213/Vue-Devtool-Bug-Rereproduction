<template lang="pug">
  div(class="font-tag" v-click-outside="clickOutsideHandler")
    template(v-if="!isTouchDevice")
      div(:class="{'showMore': showMore, 'font-tag__container': !showMore, 'font-tag__flex-container': true}")
        div(class="font-tag__tag-wrapper pointer" v-for="tag in tags"
          @click="onClick(tag)")
          div(class="font-tag__tag") {{ tag }}
      div(v-if="!showMore" class="font-tag__more-wrapper")
        div(class="font-tag__tag-wrapper pointer"
          @click="onClickMore")
          div(class="font-tag__tag") {{ 'more...' }}
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
import vClickOutside from 'v-click-outside'
import { mapActions, mapMutations, mapState } from 'vuex'

export default Vue.extend({
  directives: {
    clickOutside: vClickOutside.directive
  },
  created() {
    if (this.tags.length === 0) {
      this.addFontTags()
    }
  },
  computed: {
    ...mapState('fontTag', ['tags', 'showMore']),
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
    }
  },
  methods: {
    ...mapActions('fontTag', {
      addFontTags: 'ADD_FONT_TAGS'
    }),
    ...mapMutations('fontTag', {
      setShowMore: 'SET_SHOW_MORE'
    }),
    onClick(tag: string) {
      this.$emit('search', tag)
    },
    onClickMore() {
      this.setShowMore(true)
    },
    clickOutsideHandler() {
      if (this.showMore) {
        this.setShowMore(false)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.font-tag {
  position: relative;
  font-size: 14px;
  &__container {
    overflow: hidden;
    max-height: 43px;
    margin: 0 -5px 0 -5px;
    &-mobile {
      overflow-x: scroll;
      @include no-scrollbar;
    }
  }
  &__more {
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
      padding: 6px;
      border-radius: 12px;
      border: 1px solid #E0E0E0;
      margin: 4px
    }
  }
  .showMore {
    background: white;
    padding: 5px;
    border-radius: 5px;
  }
}
</style>
