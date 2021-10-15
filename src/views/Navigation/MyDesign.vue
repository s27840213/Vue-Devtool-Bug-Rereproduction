<template lang="pug">
  div(class="editor")
    navigation-header(node="My Design")
    sidebar
    section
      div(class="content")
</template>

<script lang="ts">
import Vue from 'vue'
import Sidebar from '@/components/navigation/mydesign/Sidebar.vue'
import NavigationHeader from '@/components/navigation/NavigationHeader.vue'

export default Vue.extend({
  name: 'MyDesgin',
  components: {
    Sidebar,
    NavigationHeader
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
.editor {
  @include size(100%, 100%);
  max-height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr;
  > section:nth-child(2) {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
  }
}

.content {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr auto;
  padding-top: 50px;
  height: calc(100% - 50px);
  &__main {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr;
  }

  &__editor {
    position: relative;
    height: 100%;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr auto;
  }

  &__panel {
    position: relative;
    width: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-columns: 1fr;
  }
}
</style>
