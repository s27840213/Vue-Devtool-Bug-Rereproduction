<template lang="pug">
  div(class="folder-item")
    div(class="folder-block"
        @click="emitGoto")
      svg-icon(iconName="folder"
              iconWidth="24px"
              iconColor="gray-2")
    div(class="folder-name")
      span {{ name }}
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    name: String
  },
  methods: {
    emitGoto() {
      this.$emit('goto')
    }
  }
})
</script>

<style lang="scss" scoped>
.folder-block {
  width: 63px;
  height: 63px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid setColor(gray-4);
  box-sizing: border-box;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    border: none;
    background-color: setColor(gray-5);
  }
}

.folder-name {
  width: 63px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  > span {
    font-family: Mulish;
    font-size: 14px;
    font-weight: 400;
    color: setColor(gray-1);
  }
}
</style>
