<template lang="pug">
  div(class="design-item")
    div(class="design-block")
      img(v-if="thumbnail === ''" class="design-thumbnail"
          :src="require('@/assets/img/svg/image-preview.svg')")
      img(v-else class="design-thumbnail"
          :src="thumbnail")
    div(class="design-name")
      span {{ name }}
    div(class="design-size")
      span {{ `${width}x${height}` }}
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    name: String,
    width: Number,
    height: Number,
    thumbnail: String
  },
  data() {
    return {
    }
  },
  computed: {
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.design-block {
  width: 205px;
  height: 182px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid setColor(gray-4);
  box-sizing: border-box;
  border-radius: 4px;
}

.design-name {
  width: 205px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  > span {
    font-family: Mulish;
    font-size: 16px;
    font-weight: 400;
    color: setColor(gray-1);
  }
}

.design-size {
  width: 205px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -5px;
  > span {
    font-family: Mulish;
    font-size: 12px;
    font-weight: 400;
    color: setColor(gray-3);
  }
}
</style>
