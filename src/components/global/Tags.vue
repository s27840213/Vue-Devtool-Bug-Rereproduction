<template lang="pug">
  div(class="font-tag" v-click-outside="clickOutsideHandler")
    template(v-if="!isTouchDevice")
      div(class="font-tag__flex-container"
          :style="containerStyle")
        div(class="font-tag__tag-wrapper pointer" v-for="tag in tags"
          @click="onClick(tag)")
          div(class="font-tag__tag") {{ tag }}
      div(v-if="!showMore" class="font-tag__more-wrapper")
        div(class="font-tag__tag-wrapper pointer"
          @click="onClickMore")
          div(class="font-tag__tag") {{ `${$t('NN0082')}...` }}
    template(v-else)
      div(class="font-tag__container-mobile")
        div(class="font-tag__flex-container-mobile")
          div(class="font-tag__tag-wrapper pointer" v-for="tag in tags"
            @click="onClick(tag)")
            div(class="font-tag__tag") {{ tag }}

</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    tags: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      showMore: false
    }
  },
  computed: {
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
    },
    containerStyle(): Record<string, string|number> {
      return this.showMore ? {
        position: 'absolute',
        background: 'white',
        padding: '5px',
        borderRadius: '5px',
        zIndex: 1
      } : {
        overflow: 'hidden',
        maxHeight: '43px',
        margin: '0 -5px 0 -5px'
      }
    }
  },
  methods: {
    onClick(tag: string) {
      this.$emit('search', tag)
    },
    setShowMore(bool: boolean) {
      this.showMore = bool
      this.$emit('showMore', bool)
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
  &__flex-container {
    display: flex;
    flex-wrap: wrap;
  }
  &__more-wrapper {
    position: absolute;
    padding: 0 0 0 10px;
    top: 0;
    right: 0;
    color: #4EABE6;
    background: white;
  }
  &__tag-wrapper {
    flex-shrink: 0;
    padding: 6px;
    border-radius: 12px;
    border: 1px solid #E0E0E0;
    margin: 4px
  }
  // mobile layout
  &__container-mobile {
    @include no-scrollbar;
    overflow-x: scroll;
  }
  &__flex-container-mobile {
    display: flex;
  }
}
</style>
