<template lang="pug">
div(class="overlay-item" :class="{active, [theme]: true}")
  div(class="overlay-item__imgs")
    img(:src="baseImg")
    svg-icon(v-if="!mask"
      class="overlay-item__mask"
      iconName="forbid" iconWidth="24px" iconColor="gray-2")
    img(v-else class="overlay-item__mask"
        draggable="false"
        :src="`https://template.vivipic.com/svg/${mask.id}/prev?ver=${mask.ver}`")
  span(class="overlay-item__name") {{ name }}
</template>

<script lang="ts">
import { IAssetObject } from '@/interfaces/shape'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'OverlayItem',
  // components: {
  // },
  props: {
    name: {
      type: String,
      required: true,
    },
    baseImg: {
      type: String,
      required: true,
    },
    mask: {
      type: [Object, null] as PropType<IAssetObject | null>,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
    theme: {
      type: String as PropType<'dark' | 'light' | 'mobile'>,
      required: true,
    },
  },
  // data() {
  //   return {
  //   }
  // },
  // computed: {
  // },
  // mounted() {
  // },
  // methods: {
  // }
})
</script>

<style lang="scss" scoped>
.overlay-item {
  display: grid;
  text-align: center;

  // Set font color in different state.
  &:hover {
    color: setColor(blue-hover);
  }
  &:not(:hover).active {
    color: setColor(blue-1);
  }
  &:not(:hover):not(.active) {
    color: setColor(gray-3);
  }

  &.active .overlay-item__imgs {
    @include selection-border(3px);
  }

  &__imgs {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    border-radius: 5px;
    overflow: hidden;
    img {
      width: 100%;
    }
  }
  &__mask {
    position: absolute;
  }
}

.dark.overlay-item {
  gap: 4px;
}
</style>
