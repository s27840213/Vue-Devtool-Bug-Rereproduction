<template lang="pug">
div(:class="`nubtn ${theme} ${sizeClass} ${status}`"
    v-hint="hint"
    @click="click")
  svg-icon(v-if="theme.includes('icon')"
          :iconName="icon" iconWidth="24px" :iconColor="iconColor")
  span(v-if="theme !== 'icon'")
    slot
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'

export default Vue.extend({
  name: 'Nubtn',
  // Let status prop and @status will be the target of v-model, https://bit.ly/3ukz2Yq
  model: {
    prop: 'status',
    event: 'status'
  },
  props: {
    theme: {
      type: String as PropType<'primary'|'outline'|'text'|'icon_text'|'icon'|'ghost'|'ghost_outline'|'danger'|'secondary'>,
      default: 'primary'
    },
    // *-full mean button will occupy all width.
    size: {
      type: String as PropType<'sm'|'sm-full'|'mid'|'mid-full'>,
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
    }
  },
  methods: {
    updateStatus() {
      const newStatus = this.status === 'disabled' ? 'disabled'
        : this.active ? 'active'
          : 'default'
      this.$emit('status', newStatus)
    },
    click(event: Event) {
      if (this.status === 'disabled') return
      this.active = !this.active
      this.updateStatus()
      this.$emit('click', event)
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
  &:not(.full) {
    margin-left: auto;
    margin-right: auto;
    width: fit-content;
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
:hover, .hover { // In this way, :hover can overwrite default and active but not disabled.
  --blue: #{setColor(blue-hover)};
}
.disabled {
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
  width: 32px;
  height: 32px;
  &.active {
    background-color: setColor(blue-3);
  }
  &:hover, &.hover {
    background-color: setColor(blue-3, 0.5);
  }
  &.disabled {
    opacity: 0.5;
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
  &:hover, &.hover {
    color: setColor(blue-1);
    background-color: setColor(white);
  }
  &.disabled {
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
  &:hover, &.hover {
    color: setColor(white);
    border: 1px solid setColor(white);
  }
  &.disabled {
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
  &:hover, &.hover {
    background-color: #FC5757;
  }
  &.disabled {
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
  &:hover, &.hover {
    color: setColor(gray-2);
    background-color: setColor(gray-4);
    border: 1px solid setColor(gray-3);
  }
  &.disabled {
    color: setColor(white);
    background-color: setColor(gray-4);
    border: none;
  }
}
</style>
