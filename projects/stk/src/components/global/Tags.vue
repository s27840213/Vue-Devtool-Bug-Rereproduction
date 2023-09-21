<template lang="pug">
div(class="tags" v-click-outside="clickOutsideHandler")
  template(v-if="!$isTouchDevice()")
    div(class="tags__flex-container"
        :style="containerStyle")
      div(v-for="tag in tags"
          :key="tag.label"
          :class="`tags__tag-wrapper ${theme}`"
          @click="onClick( tag.value )")
        div(class="tags__tag") {{ tag.label }}
    div(v-if="!showMore" class="tags__more-wrapper")
      div(class="tags__tag-wrapper"
        @click="onClickMore")
        div(class="tags__tag") {{ `${$t('NN0082')}...` }}
  template(v-else)
    div(class="tags__container-mobile" ref="container")
      div(class="tags__flex-container-mobile")
        div(v-for="tag in tags" :active="tag.active || undefined"
          :key="tag.label"
          :class="`tags__tag-wrapper ${theme}`"
          @click="onClick(tag.value)")
          div(class="tags__tag") {{ tag.label }}
</template>

<script lang="ts">
import vClickOutside from 'click-outside-vue3'
import { defineComponent, PropType } from 'vue'

export interface ITag {
  label: string
  value: string
  active: boolean
}

export default defineComponent({
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    tags: {
      type: Array as PropType<ITag[]>,
      required: true
    },
    theme: {
      type: String,
      default: 'light'
    },
    scrollLeft: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      showMore: false
    }
  },
  emits: ['search', 'showMore', 'scroll'],
  mounted() {
    const elContainer = this.$refs.container as HTMLElement
    elContainer.scrollLeft = this.scrollLeft
    elContainer.onscroll = () => {
      this.$emit('scroll', elContainer.scrollLeft)
    }
  },
  beforeUnmount() {
    const elContainer = this.$refs.container as HTMLElement
    elContainer.onscroll = null
  },
  watch: {
    tagsOrScrollLeftChange() {
      this.$nextTick(() => {
        const elContainer = this.$refs.container as HTMLElement
        if (this.scrollLeft >= 0 && this.scrollLeft <= elContainer.scrollWidth - elContainer.clientWidth) elContainer.scrollLeft = this.scrollLeft
      })
    }
  },
  computed: {
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
    },
    tagsOrScrollLeftChange() {
      const { tags, scrollLeft } = this
      return { tags, scrollLeft }
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
.tags {
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
    margin: 4px 0;
    border-radius: 10px;
    border: 1px solid #E0E0E0;
    cursor: pointer;
    &.light {
      color: black;
      background-color: white;
    }
    &.dark {
      color: setColor(black-5);
      background-color: setColor(black-3);
      border: none;
      &[active] {
        color: setColor(gray-1);
        background-color: setColor(gray-4);
      }
    }
  }
  &__tag-wrapper + &__tag-wrapper {
    margin-left: 8px;
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
