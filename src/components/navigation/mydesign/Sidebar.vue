<template lang="pug">
  div(class="sidebar")
    div(class="logo")
    div(class="nav")
      div(class="nav-container")
        div(class="nav-item" :class="{'bg-blue-1': (currentSelectedFolder === 'a')}"
            @click="handleSelection('a')")
          svg-icon(iconName="all"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text") 我所有設計
        div(class="nav-item" :class="{'bg-blue-1': (currentSelectedFolder === 'h')}"
            @click="handleSelection('h')")
          svg-icon(iconName="heart"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text") 我的最愛
        sidebar-folder(v-for="folder in folders" :folder="folder" :level="0" :parents="[]")
        div(class="nav-item" :class="{'bg-blue-1': (currentSelectedFolder === 't')}"
            @click="handleSelection('t')")
          svg-icon(iconName="trash"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text") 垃圾桶
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import SidebarFolder from '@/components/navigation/mydesign/SidebarFolder.vue'

export default Vue.extend({
  components: {
    SidebarFolder
  },
  data() {
    return {
    }
  },
  props: {
  },
  computed: {
    ...mapGetters('design', {
      currentSelectedFolder: 'getCurrSelectedFolder',
      folders: 'getFolders'
    })
  },
  methods: {
    ...mapMutations('design', {
      setCurrentSelectedFolder: 'SET_currSelectedFolder'
    }),
    handleSelection(selection: string) {
      this.setCurrentSelectedFolder(selection)
    }
  }
})
</script>

<style lang="scss" scoped>
.sidebar {
  @include size(240px, 100%);
  background-color: setColor(nav);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  z-index: setZindex(sidebar);
}

.logo {
  width: 100%;
  height: 50px;
  background-color: setColor(blue-1);
}

.nav {
  @include size(100%, 100%);
  overflow: auto;
}

.nav-container {
  margin-top: 135px;
  min-width: 100%;
  width: fit-content;
}

.nav-item {
  grid-template-columns: 20px auto;
  padding: 10px 10px 10px 16px;
  width: 100%;
  display: grid;
  grid-column-gap: 10px;
  align-items: center;
  box-sizing: border-box;
  transition: background-color 0.2s;
  margin-bottom: 10px;
  cursor: pointer;
  &__text {
    font-family: 'NotoSansTC';
    text-align: left;
    color: white;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2.5px;
  }
}
</style>
