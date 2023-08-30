<template lang="pug">
div(class="menu" :style="rootStyles")
  div(class="menu-top")
    template(v-for="l1 in navItems" :key="l1.name")
      details(v-if="!l1.hidden" :class="{'text-blue-1': currentPage === l1.name}")
        summary
          url(:url="l1.url") {{l1.label}}
          svg-icon(v-if="l1.content" iconName="chevron-down"
                  iconColor="gray-1" iconWidth="16px")
        div(v-if="l1.content")
          template(v-for="l2 in l1.content" :key="l2.name")
            url(v-if="l2.url" :url="l2.url") {{l2.label}}
            details(v-else-if="l2.content")
              summary
                span {{l2.label}}
                svg-icon(iconName="chevron-down"
                  iconColor="gray-1" iconWidth="16px")
              url(v-for="l3 in l2.content" :key="l3.label" :url="l3.url" :newTab="l3.newTab") {{l3.label}}
  div(class="menu-bottom")
    template(v-if="!isLogin")
      div(class="menu-bottom__link")
        router-link(:to="{ path: '/login', query: { redirect: currPath }}") {{$tc('NN0168', 1)}}
      div(class="menu-bottom__link")
        router-link(:to="{ path: '/signup', query: { redirect: currPath }}") {{$tc('NN0169', 1)}}
    template(v-else)
      div(class="menu-bottom__profile")
        avatar(class="mr-10"
          :textSize="14"
          :avatarSize="35")
      div(class="menu-bottom__link")
        details
          summary
            span {{$tc('NN0649')}}
            svg-icon(iconName="chevron-down" iconColor="gray-1" iconWidth="16px")
          div(@click="close()")
            url(v-for="item in settingsItems" :key="item.name" :url="`/settings/${item.name}`"
                :class="{'text-blue-1': currentPage === item.name}") {{item.label}}
      div(class="menu-bottom__link"
        @click="onLogoutClicked()")
        span {{$tc('NN0167', 1)}}
</template>

<script lang="ts">
import Avatar from '@/components/Avatar.vue'
import Url from '@/components/global/Url.vue'
import constantData, { IHeaderL1 } from '@/utils/constantData'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  components: {
    Avatar,
    Url
  },
  emits: ['closeMenu'],
  data() {
    return {
      settingsItems: constantData.settingsItems()
        .filter((it: { name: string }) => { return it.name !== 'hr' }),
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin',
      userInfo: 'webView/getUserInfo'
    }),
    navItems(): IHeaderL1[] {
      return constantData.headerItems(true)
    },
    currentPage(): string {
      const { name } = this.$router.currentRoute.value
      return (name as string) === 'Settings'
        ? this.$route.params.view as string
        : (name as string) || ''
    },
    currPath(): string {
      return this.$route.path || '/'
    },
    rootStyles(): {[key: string]: string} {
      return {
        paddingTop: `${50 + this.userInfo.statusBarHeight}px`
      }
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
.menu {
  @include size(280px, 100%);
  @include body-MD;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr;
  row-gap: 15px;
  position: relative;
  left: calc(100% - 280px + 24px);
  box-sizing: border-box;
  padding: 50px 14px;
  overflow-y: auto;
  text-align: left;
  color: setColor(gray-1);
  background-color: setColor(gray-7);
  &-bottom__link {
    margin-top: 6px;
    cursor: pointer;
  }
  a {
    display: block;
    width: 100%;
    text-decoration: unset;
    color: inherit;
  }
}

.menu-top,
.menu-bottom {
  summary {
    outline: none; // For Safari 14.3, which have a summary outline by default.
  }
  details {
    display: flex;
    flex-direction: column;
    summary {
      span {
        display: inline-block;
      }
      list-style: none; // Romove detail arrow in Chrome
      &::-webkit-details-marker {
        display: none; // Romove detail arrow in Safari
      }
    }
  }
  details > div {
    // Only first child pad 20px
    padding-left: 20px;
  }
  details[open] > summary > svg {
    // Flip arrow icon if open
    transform: scaleY(-1);
  }
  summary:focus,
  details[open] > summary,
  details[open] > summary > svg {
    color: setColor(blue-hover);
  }
  span,
  a {
    padding: 7px 0;
  }
}
</style>
