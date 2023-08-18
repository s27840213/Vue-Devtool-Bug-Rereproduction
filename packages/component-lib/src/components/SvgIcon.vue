<template lang="pug">
svg(v-if="iconName === 'loading'"
    class="svg-icon"
    :class="`text-${iconColor} svg-${iconName}`"
    viewBox="0 0 120 30"
    :style="iconStyles()"
    v-html="loadingSvg")
svg(v-else class="svg-icon" :class="`text-${iconColor} svg-${iconName}`"
    :style="iconStyles()")
  use(:xlink:href="`#${iconName}`")
</template>

<script lang="ts">
// import svgIconUtils from '@/utils/svgIconUtils'
import { defineComponent } from 'vue'

// eslint-disable-next-line no-undef
// const requireAll = (requireContext: __WebpackModuleApi.RequireContext) => requireContext.keys().map(requireContext)
// const req = require.context('@/assets/icon', true, /\.svg$/, 'lazy-once')

// if (window.location.host !== 'vivipic.com') {
//   requireAll(req).forEach((promise: any) => {
//     promise.then((context: any) => {
//       svgIconUtils.pushIcon(context.default?.id)
//     })
//   })
// } else {
//   requireAll(req)
// }

export default defineComponent({
  emits: [],
  name: 'SvgIcon',
  props: {
    iconName: {
      type: [String],
      default: 'menu'
    },
    iconWidth: {
      type: String,
      default: '40px'
    },
    iconColor: {
      type: String,
      default: 'blue-1'
    },
    iconHeight: {
      type: String
    }
  },
  data() {
    return {
      loadingSvg: `
        <circle cx="15" cy="15" r="15">
            <animate attributeName="r" from="15" to="15"
                    begin="0s" dur="0.8s"
                    values="15;9;15" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="1" to="1"
                    begin="0s" dur="0.8s"
                    values="1;.5;1" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="15" r="9" fill-opacity="0.3">
            <animate attributeName="r" from="9" to="9"
                    begin="0s" dur="0.8s"
                    values="9;15;9" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="0.5" to="0.5"
                    begin="0s" dur="0.8s"
                    values=".5;1;.5" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
        <circle cx="105" cy="15" r="15">
            <animate attributeName="r" from="15" to="15"
                    begin="0s" dur="0.8s"
                    values="15;9;15" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="1" to="1"
                    begin="0s" dur="0.8s"
                    values="1;.5;1" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
      `
    }
  },
  methods: {
    iconStyles() {
      return {
        width: this.iconWidth,
        height: this.iconHeight ?? this.iconWidth
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.svg-icon {
  width: 100%;
  transition:
    background-color 0.4s,
    color 0.4s;
  fill: currentColor;
  &:focus {
    outline: none;
  }
}
</style>
