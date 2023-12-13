<template lang="pug">
div(:class="`nubtn ${proj} ${theme} ${sizeClass} ${status} ${device}`"
    v-hint="hint"
    ref="root"
    @click="click")
  svg-icon(v-if="iconName"
          :iconName="iconName" :iconWidth="iconSize" :iconColor="iconColor")
  span(v-if="!theme.includes('icon') || theme.includes('icon_')")
    slot
</template>

<script lang="ts">
import useTapTransition from '@/composable/useTapTransition'
import { IColorKeys } from '@/interfaces/color'
import { defineComponent, PropType, ref } from 'vue'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    nubtn: typeof component
  }
}

export type INubtnThemes = 'primary' | 'outline' | 'text' | 'icon_text' | 'icon' | 'icon2' |
  'ghost' | 'ghost_outline' | 'danger' | 'secondary' | 'edit' | 'icon_pill'
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
      type: [String, Array] as
        PropType<string | [string, IColorKeys] | [string, IColorKeys | undefined, string]>,
    },
    hint: {
      type: String,
      default: ''
    },
  },
  setup() {
    const root = ref(null)
    const pressed = ref(false)
    useTapTransition(root, pressed)
    return {
      root,
      pressed,
    }
  },
  computed: {
    proj() {
      return process.env.VUE_APP_APP_NAME as 'pic' | 'stk' | 'cm'
    },
    device() {
      return this.$isTouchDevice() ? 'mobile' : 'desktop'
    },
    status(): 'default' | 'active' | 'disabled' | 'pressed' {
      return this.disabled ? 'disabled'
        : this.pressed ? 'pressed'
          : this.active ? 'active' : 'default'
    },
    sizeClass(): string {
      return this.size.replace('-', ' ')
    },
    iconName(): string | undefined {
      return Array.isArray(this.icon) ? this.icon[0] : this.icon
    },
    iconSize(): string {
      if (Array.isArray(this.icon) && this.icon[2]) { // Case 2
        return this.icon[2]
      } 
      return this.theme === 'icon_pill' && this.size.includes('sm') ? '20px' : '24px'
    },
    iconColor() {
      if (Array.isArray(this.icon) && this.icon[1]) { // Case 2
        return this.icon[1]
      } 
      // undefined means the same color with text.
      return undefined
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
  gap: 8px;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
  > span {
    // The same with svg-icon.
    transition: background-color 0.4s, color 0.4s;
  }

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

@mixin default-size-cm {
  &.sm {
    font-size: 12px;
    line-height: 16px;
    height: 32px;
  }
  &.mid {
    font-size: 14px;
    line-height: 20px;
    height: 40px;
  }
  padding: 8px 16px;
  font-weight: 700;
  border-radius: 50px;
}

// Common blue color
// Color rule priority: disabled > hover > active > default
.default {
  --blue: #{setColor(blue-1)};
}
.active {
  --blue: #{setColor(blue-active)};
}
.desktop:hover, .hover, .pressed { // In this way, .desktop:hover can overwrite default and active but not disabled.
  --blue: #{setColor(blue-hover)};
}
.desktop.disabled, .mobile.disabled { // Add .desktop can make .disabled css weight > .desktop:hover
  --blue: #{setColor(gray-4)};
}

// Themes rules
.nubtn.primary.pic {
  @include default-size;
  color: setColor(white);
  background-color: var(--blue);
}
.nubtn.primary.cm {
  @include default-size-cm;
  color: #323232;
  &.default {
    background-color: #FDD248;
  }
  &.desktop:hover, &.hover, &.pressed, &.active {
    background-color: #E4BD41;
  }
  &.disabled {
    background-color: #A3A3A3;
  }
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
.nubtn.edit {
  @include default-size;
  background-color: setColor(gray-6);
  color: setColor(gray-2);
  &.active {
    color: setColor(blue-1);
    border: 2px solid setColor(blue-1);
  }
  &.desktop:hover, &.hover, &.pressed {
    color: setColor(blue-hover);
  }
  &.desktop.disabled, &.mobile.disabled {
    color: setColor(gray-4);
  }
}
.nubtn.icon_text {
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
  color: setColor(gray-2);
  &.active {
    background-color: setColor(blue-3);
  }
  &.desktop:hover, &.hover, &.pressed {
    background-color: setColor(blue-3, 0.5);
  }
  &.desktop.disabled, &.mobile.disabled {
    color: setColor(gray-4);
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
  color: setColor(gray-2);
  background-color: white;
  &.active {
    background-color: setColor(blue-3);
  }
  &.desktop:hover, &.hover, &.pressed {
    background-color: setColor(blue-4);
  }
  &.desktop.disabled, &.mobile.disabled {
    color: setColor(gray-4);
    background-color: white;
  }
}
.nubtn.ghost {
  @include btn-SM;
  font-weight: 600;
  height: 36px;
  border-radius: 50px;
  padding: 6px 24px;
  &.default, &.active {
    color: setColor(blue-1);
    background-color: setColor(blue-4);
  }
  &.desktop:hover, &.hover, &.pressed {
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
  border-radius: 50px;
  padding: 6px 24px;
  &.default, &.active {
    color: setColor(blue-3);
    border: 1px solid setColor(blue-3);
  }
  &.desktop:hover, &.hover, &.pressed {
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
  &.desktop:hover, &.hover, &.pressed {
    background-color: #FC5757;
  }
  &.desktop.disabled, &.mobile.disabled {
    background-color: setColor(gray-4);
  }
}
.nubtn.secondary.pic {
  @include default-size;
  &.default {
    color: setColor(gray-2);
    border: 1px solid setColor(gray-3);
  }
  &.active {
    color: setColor(gray-2);
    border: 1px solid setColor(gray-2);
  }
  &.desktop:hover, &.hover, &.pressed {
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

.nubtn.icon_pill {
  border-radius: 100px;
  gap: 4px;
  &.sm {
    @include body-XS;
    color: setColor(white);
    padding: 4px 8px;
    @include setColors(blue-1, black-3) using ($color) {
      background-color: $color;
    }
    &:active {
      @include setColors(blue-hover, black-5) using ($color) {
        background-color: $color;
      }
    }
  }
}
.nubtn.secondary.cm {
  @include default-size-cm;
  color: #323232;
  &.default {
    background-color: #FEF1C6;
  }
  &.hover, &.pressed, &.active {
    background-color: #CAA83A;
  }
  &.disabled {
    background-color: #A3A3A3;
  }
}

</style>
