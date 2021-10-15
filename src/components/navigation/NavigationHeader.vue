<template lang="pug">
  div(class="navigation-header")
    div(class="body-2")
      svg-icon(:iconName="'logo'"
        iconWidth="100px" iconHeight="50px")
    div(class="subtitle-2")
      div(v-for="nodeName in nodes"
        :class="{'highlight': node === nodeName}"
        @click="handleNavigation(nodeName)")
        span {{ nodeName }}
    div(class="body-2")
      div(class="search bg-white")
        input(placeholder="Search")
        svg-icon(iconName="search"
          iconWidth="20px"
          iconColor="gray-2-7")
      //- search
      //- notification
      //- user thumbnail
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import store from '@/store'

export default Vue.extend({
  props: {
    node: String
  },
  data() {
    return {
      nodes: [
        'Home',
        'Templates',
        'Tutorials',
        'Brand Kit',
        'My Design'
      ]
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    isLogin(): boolean {
      return store.getters['user/isLogin']
    },
    isAdmin(): boolean {
      return this.role === 0
    }
  },
  methods: {
    handleNavigation(nodeName: string) {
      switch (nodeName) {
        case 'My Design':
          window.location.href = window.location.origin + '/mydesign'
          break
        default:
          console.log('page does not exist yet')
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.navigation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  background-color: #eaf1f6;
  border: 1px solid #e2e5e6;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: setZindex("editor-header");
  > div {
    &:nth-child(1) {
      display: grid;
      grid-template-columns: repeat(1, auto);
      grid-template-rows: 1fr;
      column-gap: 20px;
      justify-items: center;
      align-items: center;
      margin-left: 137px;
    }
    &:nth-child(2) {
      display: grid;
      grid-template-columns: repeat(5, auto);
      grid-template-rows: 1fr;
      column-gap: 32px;
      justify-items: center;
      align-items: center;
      font-family: 'Mulish';
      > div {
        cursor: pointer;
      }
    }
    &:nth-child(3) {
      display: grid;
      grid-template-columns: repeat(3, auto);
      grid-template-rows: 1fr;
      column-gap: 20px;
      justify-items: center;
      align-items: center;
      margin-right: 40px;
      > .search {
        display: grid;
        grid-template-columns: 170px 20px;
        grid-template-rows: 1fr;
        padding: 4px 16px;
        border-radius: 4px;
        > input {
          font-family: 'Mulish';
        }
      }
    }
  }
}

.highlight {
  color: setColor(blue-1)
}
</style>
