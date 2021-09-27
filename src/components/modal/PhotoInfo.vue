<template lang="pug">
  div(class="photo-info")
    strong(class="photo-info__desc")
      span Photo by
      a(class="photo-info__link pointer"
        :href="userLink"
        target="_blank"
        rel="nofollow noopener noreferrer"
        @mousedown.prevent) {{ info.userName }}
      span on
      a(class="photo-info__link pointer"
        :href="vendorLink"
        target="_blank"
        rel="nofollow noopener noreferrer"
        @mousedown.prevent) {{ info.vendor }}
    div(v-if="info.tags && info.tags.length"
      class="photo-info__tags")
      span tag: {{ info.tags.join(',') }}
    div(class="photo-info__action")
      svg-icon(:iconName="'folder'",
        :iconColor="'gray-2'",
        :iconWidth="'20px'")
      span Add to My file
    div(class="photo-info__action")
      svg-icon(:iconName="'search'",
        :iconColor="'gray-2'",
        :iconWidth="'20px'")
      span More ...
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    info: Object
  },
  computed: {
    vendorLink (): string {
      const { vendor } = this.info as any
      const { VUE_APP_UNSPLASH_APP_NAME: unsplashAppName } = process.env
      switch (vendor) {
        case 'unsplash':
          return `https://unsplash.com/?utm_source=${unsplashAppName}&utm_medium=referral`
        case 'pexels':
          return 'https://www.pexels.com/'
        default:
          return ''
      }
    },
    userLink (): string {
      const { vendor, userLink } = this.info as any
      const { VUE_APP_UNSPLASH_APP_NAME: unsplashAppName } = process.env
      switch (vendor) {
        case 'Unsplash':
          return `${userLink}?utm_source=${unsplashAppName}&utm_medium=referral`
        default:
          return userLink
      }
    }
  }
})
</script>

<style lang="scss" scoped>
  .photo-info {
    background-color: setColor(white);
    max-width: 280px;
    padding: 10px;
    font-size: 14px;
    text-align: left;
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
    &:focus {
      outline: none;
    }
    &__link {
      color: #009fc5;
      padding: 0 5px;
      text-decoration: underline;
      white-space: nowrap;
    }
    &__action {
      padding: 5px 0;
      font-size: 16px;
      display: flex;
      align-items: center;
    }
    &__desc {
      display: block;
      margin-bottom: 5px;
      word-break: break-all;
    }
    &__tags {
      margin-bottom: 20px;
    }
  }
</style>
