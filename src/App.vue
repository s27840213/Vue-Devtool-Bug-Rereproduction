<template lang="pug">
  div(id="app")
    router-view
</template>

<style lang="scss">
#app {
  @include size(100%, 100%);
  max-height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  overflow: hidden;
}
</style>
