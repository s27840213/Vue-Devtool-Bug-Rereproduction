<template lang="pug">
  div(class="card")
    img(:src="require(`@/assets/img/svg/card/${issuer}.svg`)")
    span {{`···· ···· ···· ${last4}`}}
    span {{`Expires ${expire}`}}
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'CardInfo',
  props: {
    issuer: {
      type: String,
      required: true
    },
    last4: {
      type: String,
      required: true
    },
    expire: {
      type: String,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.card {
  display: flex;
  align-items: center;
  white-space: nowrap;
  >span { margin-left: 20px; }
}
</style>
