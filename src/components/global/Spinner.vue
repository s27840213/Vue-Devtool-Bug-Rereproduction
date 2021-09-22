<template lang="pug">
  div(class="spinner")
    div
      img(:src="require('@/assets/img/gif/loading.gif')")
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
  background-color: #e5e5e590;

  div {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 20vh;
    height: 23vh;
    font-family: Arial;
    font-style: normal;
    font-weight: 500;
    font-size: 22px;
    line-height: 22px;
    background-color: #bbbbbb;
    border-radius: 20px;

    img {
      width: 15vh;
      height: 15vh;
      padding: 0px 10px;
    }
    span {
      color: #fff;
      font-size: 20px;
      padding-top: 1vh;
    }
  }
}
</style>
