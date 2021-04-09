<template lang="pug">
  div(class="layer" ref='body' @mousedown="moveStart")
    img(v-for='(item, index) in items' :key='index' :src='item.src')
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  mounted() {
    console.log(this.item);
    this.items.push(this.item);
  },
  data() {
    return {
      items: [],
      active: false,
      initialX: 0,
      initialY: 0,
      xOffset: 0,
      yOffset: 0
    };
  },

  methods: {
    moveStart(event: MouseEvent) {
      this.initialX = event.clientX;
      this.initialY = event.clientY;
      if (event.target === this.$refs.body) {
        const el = event.target as HTMLElement;
        el.addEventListener('mouseup', this.moveEnd);

        // set the page as the moving panel.
        window.addEventListener('mousemove', this.moving);
        this.active = true;
      }
    },

    moveEnd(event: MouseEvent) {
      if (this.active) {
        this.xOffset += event.clientX - this.initialX;
        this.yOffset += event.clientY - this.initialY;

        const el = event.target as HTMLElement;
        el.removeEventListener('mouseup', this.moveEnd);
        window.removeEventListener('mousemove', this.moving);
        this.active = false;
      }
    },

    moving(event: MouseEvent) {
      console.log(`${event.clientX}, ${event.clientY}`);
      if (this.active) {
        event.preventDefault();
        const xPos = event.clientX - this.initialX + this.xOffset;
        const yPos = event.clientY - this.initialY + this.yOffset;

        const el = this.$el as HTMLElement;
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.layer {
  position: absolute;
  box-shadow:inset 0px 0px 0px 7px rgba(136, 136, 136, 0.5);
  width: 100px;
  height: 100px;
  background-color: white;
  margin:50px;

  &:active {
    background-color: rgba(168, 218, 220, 1);
  }
  &:hover {
    cursor:pointer;
  }
}
</style>
