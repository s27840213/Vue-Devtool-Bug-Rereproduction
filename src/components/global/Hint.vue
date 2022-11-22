<template lang="pug">
div(class="hint")
  transition(name="fade-up")
    div(v-if="showHint" class="hint__content")
      svg-icon(class="arrow-up" :iconName="'arrow-up'" :iconHeight="'5px'"  :iconColor="'gray-2'")
      div(class="hint__body")
        span(class="no-wrap") {{hint}}
</template>

<script lang="ts">
import hintUtils from '@/utils/hintUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Hint',
  data() {
    return {
      hintUtils
    }
  },
  computed: {
    hint(): string {
      return this.hintUtils.currHint
    },
    showHint(): boolean {
      return this.hintUtils.showHint
    }
  }
})
</script>

<style lang="scss" scoped>
.hint {
  position: absolute;
  pointer-events: none;
  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  &__body {
    color: setColor(white);
    background-color: setColor(gray-2);
    padding: 4px 8px;
    border-radius: 3px;
    > span {
      font-size: 12px;
      display: block;
    }
  }
}
</style>
