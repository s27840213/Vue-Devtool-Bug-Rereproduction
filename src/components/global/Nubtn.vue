<template lang="pug">
div(:class="`nubtn ${theme} ${sizeClass} ${status} ${$isTouchDevice?'mobile':'desktop'}`"
    v-hint="hint"
    @click="click")
  svg-icon(v-if="theme.includes('icon')"
          :iconName="icon" :iconWidth="iconSize" :iconColor="iconColor")
  span(v-if="!theme.includes('icon') || theme === 'icon_text'")
    slot
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'Nubtn',
  // Let status prop and @status will be the target of v-model, https://bit.ly/3ukz2Yq
  model: {
    prop: 'status',
    event: 'status'
  },
  props: {
    theme: {
      type: String as PropType<
        'primary'|'outline'|'text'|'icon_text'|'icon'|'icon2'|
        'ghost'|'ghost_outline'|'danger'|'secondary'
      >,
      default: 'primary'
    },
    // *-full mean button will occupy all width.
    // *-center mean button have ml/mr: auto
    size: {
      type: String as PropType<'sm'|'sm-full'|'sm-center'|'mid'|'mid-full'|'mid-center'>,
      default: 'sm'
    },
    // Use v-model if you want Nubtn switch between active/default.
    // Use :status if you want to control state from parent, not from Nubtn itself.
    // Vale: default, active, hover, disabled
    status: {
      type: String as PropType<'default'|'active'|'hover'|'disabled'>,
      default: 'default'
    },
    icon: {
      type: String,
      default: 'none'
    },
    hint: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      active: false
    }
  },
  computed: {
    sizeClass(): string {
      return this.size.replace('-', ' ')
    },
    iconColor(): string {
      return this.theme === 'icon_text' ? 'white'
        : this.status === 'disabled' ? 'gray-4' : 'gray-2'
    },
    iconSize(): string {
      return this.size.startsWith('sm') ? '18px' : '24px'
    }
  },
  methods: {
    updateStatus() {
      const newStatus = this.status === 'disabled' ? 'disabled'
        : this.active ? 'active'
          : 'default'
      this.$emit('status', newStatus)
    },
    click() {
      if (this.status === 'disabled') return
      this.active = !this.active
      this.updateStatus()
    }
  }
})
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
    height: 32px;
    padding: 4px 16px;
  }
  &.mid {
    @include btn-LG;
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
    height: 36px;
    padding: 6px 16px 6px 12px;
  }
  &.mid {
    height: 44px;
    padding: 10px 20px 10px 12px;
  }
  color: setColor(white);
  background-color: var(--blue);
}
.nubtn.icon {
  &.sm {
    width: 24px;
    height: 24px;
  }
  &.mid {
    width: 32px;
    height: 32px;
  }
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
