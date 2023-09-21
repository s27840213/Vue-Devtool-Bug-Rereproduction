<template lang="pug">
div(class="panel-nudge text-left")
  div(class="panel-nudge__top-section")
    span(class="body-XS") {{ $t('NN0888') }}
    slide-toggle(:options="options" v-model="currOption" :bgColor="'gray-6'" :switchColor="'white'" :optionWidth="'50px'" :optionHeight="'30px'")
  div(class="panel-nudge__content")
    div(class="panel-nudge__btn"
        v-tap-animation="{'bgColor': 'blue-3'}"
        @pointerdown="moveStepping('left')"
        @contextmenu.prevent)
      svg-icon(
        :iconName="'left-arrow'"
        :iconColor="'gray-2'"
        :iconWidth="'24px'")
    div(class="panel-nudge__btn"
        v-tap-animation="{'bgColor': 'blue-3'}"
        @pointerdown="moveStepping('up')"
        @contextmenu.prevent)
      svg-icon(
        :style="{transform: 'rotate(90deg)'}"
        :iconName="'left-arrow'"
        :iconColor="'gray-2'"
        :iconWidth="'24px'")
    div(class="panel-nudge__btn"
        v-tap-animation="{'bgColor': 'blue-3'}"
        @pointerdown="moveStepping('down')"
        @contextmenu.prevent)
      svg-icon(
        :style="{transform: 'rotate(-90deg)'}"
        :iconName="'left-arrow'"
        :iconColor="'gray-2'"
        :iconWidth="'24px'")
    div(class="panel-nudge__btn"
        v-tap-animation="{'bgColor': 'blue-3'}"
        @pointerdown="moveStepping('right')"
        @contextmenu.prevent)
      svg-icon(
        :style="{transform: 'rotate(180deg)'}"
        :iconName="'left-arrow'"
        :iconColor="'gray-2'"
        :iconWidth="'24px'")
</template>

<script lang="ts">
import SlideToggle from '@/components/global/SlideToggle.vue'
import eventUtils from '@/utils/eventUtils'
import shortcutUtils from '@/utils/shortcutUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    SlideToggle
  },
  data () {
    return {
      options: [{
        label: '1px',
        value: '1'
      }, {
        label: '10px',
        value: '10'
      }],
      currOption: '1'
    }
  },
  methods: {
    move (dir: 'left' | 'up' | 'down' | 'right') {
      switch (dir) {
        case 'left': {
          shortcutUtils.left(this.currOption === '10')
          break
        }
        case 'up': {
          shortcutUtils.up(this.currOption === '10')
          break
        }
        case 'down': {
          shortcutUtils.down(this.currOption === '10')
          break
        }
        case 'right': {
          shortcutUtils.right(this.currOption === '10')
          break
        }
      }
    },
    moveStepping (dir: 'left' | 'up' | 'down' | 'right', tickInterval = 100) {
      const startTime = new Date().getTime()
      const interval = window.setInterval(() => {
        if (new Date().getTime() - startTime > 500) {
          try {
            this.move(dir)
          } catch (error) {
            eventUtils.removePointerEvent('pointerup', onmouseup)
            clearInterval(interval)
          }
        }
      }, tickInterval)

      const onmouseup = () => {
        eventUtils.removePointerEvent('pointerup', onmouseup)
        if (new Date().getTime() - startTime < 500) {
          this.move(dir)
        }
        clearInterval(interval)
      }

      eventUtils.addPointerEvent('pointerup', onmouseup)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-nudge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap:12px;

  &__top-section {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__content {
    width: 100%;
    display: flex;
    justify-content: space-evenly;
    padding-bottom: 12px;
  }

  &__btn {
    background-color: setColor(gray-6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 4px;
    box-sizing: border-box;
    border: 1px solid setColor(gray-4);
  }
}

.test {
  background-color: red;
}
</style>
