<template lang="pug">
div(:class="`nubtn ${theme} ${sizeClass} ${status} ${$isTouchDevice()?'mobile':'desktop'}`"
    v-hint="hint"
    @click="click")
  svg-icon(v-if="theme.includes('icon')"
          :iconName="iconName" :iconWidth="iconSize" :iconColor="iconColor")
  span(v-if="!theme.includes('icon') || theme === 'icon_text'")
    slot
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    nubtn: typeof component
  }
}

export type INubtnThemes = 'primary' | 'outline' | 'text' | 'icon_text' | 'icon' | 'icon2' |
  'ghost' | 'ghost_outline' | 'danger' | 'secondary'
export type INubtnSize = 'sm' | 'sm-full' | 'sm-center' | 'mid' | 'mid-full' | 'mid-center'

const component = defineComponent({
  name: 'Nubtn',
  emits: ['click', 'update:active'],
  props: {
    theme: {
      type: String as PropType<INubtnThemes>,
      default: 'primary'
    },
    // *-full mean button will occupy all width.
    // *-center mean button have ml/mr: auto
    size: {
      type: String as PropType<INubtnSize>,
      default: 'sm'
    },
    // Use v-model:active if you want Nubtn modify active for you.
    // Use :active if you want to control active only from parent, not from Nubtn itself.
    active: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // Case 1: Only specify iconName, ex: icon="sliders"
    // Case 2: Specify iconName and iconColor, ex :icon="['pro', 'alarm']"
    icon: {
      type: [String, Array] as PropType<string | string[]>,
    },
    hint: {
      type: String,
      default: ''
    },
  },
  computed: {
    status(): 'default' | 'active' | 'disabled' {
      return this.disabled ? 'disabled'
        : this.active ? 'active' : 'default'
    },
    sizeClass(): string {
      return this.size.replace('-', ' ')
    },
    iconName(): string | undefined {
      return Array.isArray(this.icon) ? this.icon[0] : this.icon
    },
    iconSize(): string {
      return '24px'
    },
    iconColor(): string {
      if (Array.isArray(this.icon) && this.icon[1]) { // Case 2
        return this.icon[1]
      } else if (this.theme === 'icon_text') return 'white'
      else return this.status === 'disabled' ? 'gray-4' : 'gray-2'
    },
  },
  methods: {
    click(e: MouseEvent) {
      // Will not trigger @click when disabled
      if (this.status === 'disabled') return
      this.$emit('update:active', !this.active)
      this.$emit('click', e)
    }
  }
})

export default component
</script>

<style lang="scss" scoped>
.nubtn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  &.full {
    width: 100%;
  }
  &:not(.full) {
    width: fit-content;
  }
  &.center {
    margin-left: auto;
    margin-right: auto;
  }
}

// Common size
@mixin default-size {
  &.sm {
    @include btn-SM;
    font-weight: 600;
    height: 32px;
    padding: 4px 16px;
  }
  &.mid {
    @include btn-LG;
    font-weight: 600;
    height: 44px;
    padding: 10px 24px;
  }
}

// Common blue color
// Color rule priority: disabled > hover > active > default
.default {
  --blue: #{setColor(blue-1)};
}
.active {
  --blue: #{setColor(blue-active)};
}
.desktop:hover, .hover { // In this way, .desktop:hover can overwrite default and active but not disabled.
  --blue: #{setColor(blue-hover)};
}
.desktop.disabled, .mobile.disabled { // Add .desktop can make .disabled css weight > .desktop:hover
  --blue: #{setColor(gray-4)};
}

// Themes rules
.nubtn.primary {
  @include default-size;
  color: setColor(white);
  background-color: var(--blue);
}
.nubtn.outline {
  @include default-size;
  color: var(--blue);
  border: 1px solid var(--blue);
}
.nubtn.text {
  @include default-size;
  color: var(--blue);
}
.nubtn.icon_text {
  svg {
    margin-right: 8px;
  }
  &.sm {
    @include btn-SM;
    font-weight: 600;
    height: 36px;
    padding: 6px 16px 6px 12px;
  }
  &.mid {
    @include btn-LG;
    font-weight: 600;
    height: 44px;
    padding: 10px 20px 10px 12px;
  }
  color: setColor(white);
  background-color: var(--blue);
}
.nubtn.icon {
  width: 32px;
  height: 32px;
  &.active {
    background-color: setColor(blue-3);
  }
  &.desktop:hover, &.hover {
    background-color: setColor(blue-3, 0.5);
  }
  &.desktop.disabled, &.mobile.disabled {
    background-color: transparent;
  }
}
.nubtn.icon2 {
  // &.sm {
  //   width: 24px;
  //   height: 24px;
  // }
  &.mid {
    width: 44px;
    height: 44px;
  }
  border: 1px solid setColor(gray-3);
  background-color: white;
  &.active {
    background-color: setColor(blue-3);
  }
  &.desktop:hover, &.hover {
    background-color: setColor(blue-4);
  }
  &.desktop.disabled, &.mobile.disabled {
    background-color: white;
  }
}
.nubtn.ghost {
  @include btn-SM;
  font-weight: 600;
  height: 36px;
  padding: 6px 24px;
  border-radius: 50px;
  &.default, &.active {
    color: setColor(blue-1);
    background-color: setColor(blue-4);
  }
  &.desktop:hover, &.hover {
    color: setColor(blue-1);
    background-color: setColor(white);
  }
  &.desktop.disabled, &.mobile.disabled {
    color: setColor(gray-4);
    background-color: setColor(white);
  }
}
.nubtn.ghost_outline {
  @include btn-SM;
  font-weight: 600;
  height: 36px;
  padding: 6px 24px;
  border-radius: 50px;
  &.default, &.active {
    color: setColor(blue-3);
    border: 1px solid setColor(blue-3);
  }
  &.desktop:hover, &.hover {
    color: setColor(white);
    border: 1px solid setColor(white);
  }
  &.desktop.disabled, &.mobile.disabled {
    color: setColor(gray-4);
    border: 1px solid setColor(gray-4);
  }
}
.nubtn.danger {
  @include default-size;
  color: setColor(white);
  &.default {
    background-color: setColor(red);
  }
  &.active {
    background-color: #D9624E;
  }
  &.desktop:hover, &.hover {
    background-color: #FC5757;
  }
  &.desktop.disabled, &.mobile.disabled {
    background-color: setColor(gray-4);
  }
}
.nubtn.secondary {
  @include default-size;
  &.default {
    color: setColor(gray-2);
    border: 1px solid setColor(gray-3);
  }
  &.active {
    color: setColor(gray-2);
    border: 1px solid setColor(gray-2);
  }
  &.desktop:hover, &.hover {
    color: setColor(gray-2);
    background-color: setColor(gray-4);
    border: 1px solid setColor(gray-3);
  }
  &.desktop.disabled, &.mobile.disabled {
    color: setColor(white);
    background-color: setColor(gray-4);
    border: none;
  }
}
</style>
