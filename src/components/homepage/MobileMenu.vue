<template lang="pug">
div(class="menu")
  div(class="menu-top")
    template(v-for="item in navItems")
      details(v-if="!item.hidden" :class="{'text-blue-1': currentPage === item.name}")
        summary
          url(:url="item.url") {{item.label}}
          svg-icon(v-if="item.content" iconName="chevron-down"
                  iconColor="gray-1" iconWidth="16px")
        div(v-if="item.content")
          details(v-for="it in item.content")
            summary
              url(:url="it.url") {{it.label}}
              svg-icon(v-if="it.content" iconName="chevron-down"
                iconColor="gray-1" iconWidth="16px")
            url(v-for="i in it.content" :url="i.url" :newTab="i.newTab") {{i.label}}
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
            url(v-for="item in settingsItems" :url="`/settings/${item.name}`"
                :class="{'text-blue-1': currentPage === item.name}") {{item.label}}
      div(class="menu-bottom__link"
        @click="onLogoutClicked()")
        span {{$tc('NN0167', 1)}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
import Avatar from '@/components/Avatar.vue'
import Url from '@/components/global/Url.vue'
import constantData from '@/utils/constantData'

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
      optionSelected: 0
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    navItems(): any {
      return constantData.headerItems(true)
    },
    currentPage(): string {
      const { name, params } = this.$router.currentRoute.value
      return (name as string) === 'Settings'
        ? this.$route.params.view as string
        : (name as string) || ''
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
  summary:focus > svg {
    // Set color when user click summary
    color: setColor(blue-hover);
    outline: none; // For Safari 14.3, which have a summary outline by default.
  }
  span,
  a {
    padding: 7px 0;
  }
}
</style>
