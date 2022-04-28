<template lang="pug">
  select(class="select" autofocus :value="value"
        @input="$emit('input', $event.target.value)")
    option(v-for="op in options"
          class="option" :value="op.value || op") {{op.label || op}}
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Options',
  components: {
  },
  props: {
    options: {
      type: [], // todo
      required: true
    },
    value: {
      default: ''
    }
  },
  data() {
    return {
    }
  },
  computed: {
  },
  // mounted() {
  // },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.select {
  @include body-SM;
  height: 40px;
  padding: 8px 10px;
  background-color: white;
  border: 1px solid setColor(gray-4);
  border-radius: 4px;
  // Remove safari glass effect and add self-defined arrow to all browser. https://stackoverflow.com/a/57510283
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='black'><polygon points='0,0 100,0 50,50'/></svg>") no-repeat;
  background-size: 12px;
  background-position: right .8em top 60%;
}
</style>
