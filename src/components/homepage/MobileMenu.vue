<template lang="pug">
  div(class="mobile-menu")
    div(class="nav mobile-menu__top")
      template(v-for="item in navItems")
        div(v-if="item.condition" class="nav__option"
            :class="{'text-blue-1': currentPage === item.name}")
          a(v-if="item.url.startsWith('http')" :href="item.url"
            class="mobile-menu__link") {{item.label}}
          router-link(v-else :to="item.url"
                      class="mobile-menu__link") {{item.label}}
    div(class="nav mobile-menu__bottom")
      template(v-if="!isLogin")
        div(class="nav__option")
          router-link(:to="{ path: '/login', query: { redirect: currPath }}"
            class="mobile-menu__link") {{$tc('NN0168', 1)}}
        div(class="nav__option")
          router-link(:to="{ path: '/signup', query: { redirect: currPath }}"
            class="mobile-menu__link") {{$tc('NN0169', 1)}}
      template(v-else)
        div(class="mobile-menu__bottom__profile")
          avatar(class="mr-10"
            :textSize="14"
            :avatarSize="35")
        div(class="nav__option" @click="close()")
          router-link(to="/settings/menu"
            class="mobile-menu__link") {{$tc('TMP0145')}}
        div(class="nav__option"
          @click="onLogoutClicked()")
          span {{$tc('NN0167', 1)}}
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import Avatar from '@/components/Avatar.vue'
import constantData from '@/utils/constantData'

export default Vue.extend({
  components: {
    Avatar
  },
  data() {
    return {
      navItems: constantData.headerItem(true),
      optionSelected: 0
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    currentPage(): string {
      return this.$route.name || ''
    },
    currPath(): string {
      return this.$route.path || '/'
    }
  },
  methods: {
    onLogoutClicked() {
      localStorage.setItem('token', '')
      window.location.href = '/'
    },
    close() { this.$emit('closeMenu') }
  }
})
</script>

<style lang="scss" scoped>
.mobile-menu {
  @include size(200px, 100%);
  position: relative;
  left: calc(100% - 200px + 24px);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  background-color: setColor(gray-6);
  &__top {
    padding-top: 10vh;
  }
  &__bottom {
    position: absolute;
    top: 68%;
    &__profile {
      display: flex;
      align-items: center;
      padding-left: 10px;
      padding-right: 10px;
      padding-bottom: 10px;
      .profile-img {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        font-weight: 700;
        background: #61aac2;
        border-radius: 50%;
      }
    }
  }
  &__link {
    color: unset;
    text-decoration: unset;
    width: 100%;
    text-align: left;
  }
}
.nav {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow: scroll;
  @include no-scrollbar;
  &__option {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    line-height: 22px;
    font-weight: 400;
    margin: 7px 0 7px 15px;
    > button {
      padding: 0;
    }
  }
}
</style>
