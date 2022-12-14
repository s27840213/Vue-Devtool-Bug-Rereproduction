<template lang="pug">
div(class="relative dropdown")
  property-bar(class="pointer"
    @click.prevent="handleOpen")
    div(class="dropdown__label")
      slot {{ current || placeholder }}
    slot(name="caret-down")
      svg-icon(iconName="caret-down"
        iconWidth="10px"
        iconColor="gray-2")
  div(v-if="showDropdown && options.length"
    v-click-outside="handleClose"
    class="dropdown__options")
    div(v-for="option in options"
      :key="option.value || option"
      @click.stop="() => handleSelect(option)")
      slot(name="option" :data="option")
        div(class="dropdown__option") {{ option.label || option }}
  div(v-if="showDropdown && isCustomOptions"
    v-click-outside="handleClose"
    class="dropdown__options")
    slot(name="custom")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import vClickOutside from 'click-outside-vue3'

export default defineComponent({
  props: {
    current: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      required: true
    },
    options: {
      type: Array,
      default: () => []
    },
    closeAfterSelection: {
      type: Boolean,
      default: true
    },
    isCustomOptions: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  emits: ['open', 'close', 'select'],
  data () {
    return {
      showDropdown: false
    }
  },
  methods: {
    handleOpen (event: Event) {
      this.showDropdown = true
      this.$emit('open', event)
    },
    handleClose (event: Event) {
      this.showDropdown = false
      this.$emit('close', event)
    },
    handleSelect (option: any) {
      this.closeAfterSelection && (this.showDropdown = false)
      this.$emit('select', option)
    }
  }
})
</script>

<style lang="scss" scoped>
  .dropdown {
    &__options {
      position: absolute;
      top: -1px;
      left: -1px;
      min-width: 100%;
      z-index: 1;
      display: flex;
      flex-direction: column;
      border: 1px solid setColor(gray-4);
      background-color: setColor(white);
    }
    &__option {
      padding: 6px 10px;
      &:hover {
        background-color: setColor(gray-4);
      }
    }
  }
</style>
