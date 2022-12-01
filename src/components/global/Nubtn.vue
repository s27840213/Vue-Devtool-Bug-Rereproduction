<template lang="pug">
div(:class="`nubtn ${theme} ${sizeClass} ${status}`"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
    @click="click")
  svg-icon(v-if="theme.includes('icon')"
          :iconName="icon" iconWidth="24px" :iconColor="iconColor")
  span(v-if="theme !== 'icon'")
    slot
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Nubtn',
  model: { // Let status prop and @status will be the target of v-model
    prop: 'status',
    event: 'status'
  },
  props: {
    // The same as style in figma, but style is reserved prop name.
    // Value: primary, outline, text, icon_text, icon, ghost, ghost_outline, danger, secondary
    theme: {
      type: String,
      default: 'primary'
    },
    // Value: sm, sm-full, mid, mid-full
    // full mean button will occupy all width.
    size: {
      type: String,
      default: 'sm'
    },
    icon: {
      type: String,
      default: 'none'
    },
    // Use v-model if parent compenent need Nubtn status value.
    // Use :status if you don't want Nubtn change status.
    // Vale: default, hover, disabled, active
    status: {
      type: String,
      default: 'default'
    }
  },
  data() {
    return {
      hover: false,
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
        : this.hover ? 'hover'
          : this.active ? 'active'
            : 'default'
      this.$emit('status', newStatus)
    },
    mouseenter() {
      this.hover = true
      this.updateStatus()
    },
    mouseleave() {
      this.hover = false
      this.updateStatus()
    },
    click() {
      this.active = !this.active
      this.updateStatus()
      this.$emit('click')
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
    margin: auto;
  }
}

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

.default {
  --blue: #{setColor(blue-1)};
}
.hover {
  --blue: #{setColor(blue-hover)};
}
.disabled {
  --blue: #{setColor(gray-4)};
}
.active {
  --blue: #{setColor(blue-active)};
}

.primary {
  @include default-size;
  color: setColor(white);
  background-color: var(--blue);
}
.outline {
  @include default-size;
  color: var(--blue);
  border: 1px solid var(--blue);
}
.text {
  @include default-size;
  color: var(--blue);
}
.icon_text {
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
.icon {
  width: 32px;
  height: 32px;
  &.hover {
    background-color: setColor(blue-3, 0.5);
  }
  &.disabled {
    opacity: 0.5;
  }
  &.active {
    background-color: setColor(blue-3);
  }
}
.ghost {
  height: 36px;
  padding: 6px 24px;
  border-radius: 50px;
  &.default {
    color: setColor(blue-1);
    background-color: setColor(blue-4);
  }
  &.hover {
    color: setColor(blue-1);
    background-color: setColor(white);
  }
  &.disabled {
    color: setColor(gray-4);
    background-color: setColor(white);
  }
}
.ghost_outline {
  height: 36px;
  padding: 6px 24px;
  border-radius: 50px;
  &.default {
    color: setColor(blue-3);
    border: 1px solid setColor(blue-3);
  }
  &.hover {
    color: setColor(white);
    border: 1px solid setColor(white);
  }
  &.disabled {
    color: setColor(gray-4);
    border: 1px solid setColor(gray-4);
  }
}
.danger {
  @include default-size;
  color: setColor(white);
  &.default {
    background-color: setColor(red);
  }
  &.hover {
    background-color: #FC5757;
  }
  &.disabled {
    background-color: setColor(gray-4);
  }
  &.active {
    background-color: #D9624E;
  }
}
.secondary {
  @include default-size;
  &.default {
    color: setColor(gray-2);
    border: 1px solid setColor(gray-3);
  }
  &.hover {
    color: setColor(gray-2);
    background-color: setColor(gray-4);
    border: 1px solid setColor(gray-3);
  }
  &.disabled {
    color: setColor(white);
    background-color: setColor(gray-4);
    border: none;
  }
  &.active {
    color: setColor(gray-2);
    border: 1px solid setColor(gray-2);
  }
}
</style>
