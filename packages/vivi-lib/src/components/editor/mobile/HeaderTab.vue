<template lang="pug">
template(v-for="(tab, index) in tablist" :key="`${tab.icon}-${index}`")
  template(v-if="!tab.tabs")
    div(v-if="!tab.isHidden"
        :class="{'header-tab__feature-icon': !tab.logo, 'click-disabled': tab.disabled, 'panel-icon': tab.isPanelIcon}"
        :style="`width: ${tab.width}px; height: ${tab.height !== undefined ? tab.height : tab.width}px`"
        @click.prevent.stop="handleTabAction(tab.action)"
        v-press="() => handleTabAction(tab.longPressAction)")
      svg-icon(:iconName="tab.icon"
                :iconWidth="`${tab.width}px`"
                :iconHeight="`${tab.height !== undefined ? tab.height : tab.width}px`"
                :iconColor="iconColor(tab)")
  div(v-else class="header-tab__feature-group")
    header-tab(:tablist="tab.tabs")
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'

export type TabColor = {
  normal?: string
  active?: string
  disabled?: string
}

export type TabConfig = {
  icon: string
  logo?: boolean
  disabled?: boolean
  width: number
  height?: number
  action?: () => void
  longPressAction?: () => void
  // If isPanelIcon is true, MobilePanel v-out will not be triggered by this icon.
  isPanelIcon?: boolean
  isHidden?: boolean
  color?: TabColor
  isActive?: (icon: string) => boolean
  tabs?: TabConfig[]
}

export default defineComponent({
  name: 'header-tab',
  props: {
    tablist: {
      required: true,
      type: Array as PropType<TabConfig[]>
    },
  },
  methods: {
    handleTabAction(action?: () => void) {
      if (action) {
        action()
      }
    },
    iconColor(tab: TabConfig) {
      const { normal = 'white', active = 'white', disabled = 'gray-2' } = tab.color ?? {}
      return tab.disabled ? disabled
        : (tab.isActive && tab.isActive(tab.icon) ? active : normal)
    }
  }
})
</script>

<style lang="scss">
.header-tab {
  &__feature-icon {
    transition: background-color 0.1s;
    @include pic {
      padding: 2px;
    }
    @include stk {
      padding: 4px;
    }
    border-radius: 3px;
    &:active {
      background-color: setColor(gray-2);
    }
  }

  &__feature-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}
</style>
