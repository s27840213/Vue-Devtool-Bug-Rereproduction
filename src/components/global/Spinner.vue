<template lang="pug">
  div(class="spinner")
    div
      img(:src="require('@/assets/img/gif/rocket-loading.gif')")
      span Loading...
</template>

<script lang="ts">

import Vue from 'vue'

export default Vue.extend({

})
</script>

<style lang="scss" scoped>
.spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  width: 100vw;
  height: 100vh;
  left:0;
  top:0;
  background-color: #000000a1;

  div {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 20vh;
    height: 23vh;

    img {
      width: 15vh;
      height: 15vh;
      padding: 0px 10px;
    }
    span {
      color: #fff;
      font-size: 22px;
      font-family: Mulish;
      font-weight: 700;
      padding-top: 2vh;
    }
  }
}
</style>
