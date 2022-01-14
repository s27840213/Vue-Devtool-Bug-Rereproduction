<template lang="pug">
  div(class="res-info")
    strong(v-if="info.userName || info.vendor"
      class="res-info__desc")
      span {{ info.create }} by
      a(v-if="info.userLink"
        class="res-info__link pointer"
        :href="userLink"
        target="_blank"
        rel="nofollow noopener noreferrer"
        @mousedown.prevent)
        span {{ info.userName }}
        span {{info.authorCompany ? ', ' + info.authorCompany : ''}}
      template(v-else
        class="px-5")
        span {{ ' ' + info.userName }}
        span {{info.authorCompany ? ', ' + info.authorCompany : ''}}
      span(v-if="info.vendor") on
      a(v-if="info.vendor && vendorLink"
        class="res-info__link pointer"
        :href="vendorLink"
        target="_blank"
        rel="nofollow noopener noreferrer"
        @mousedown.prevent) {{ info.vendor }}
      template(v-else)
        span(v-if="info.vendor"
          class="pl-5") {{ info.vendor }}
    div(v-if="info.tags && info.tags.length"
      class="res-info__tags")
      span tag: {{ info.tags.join(', ') }}
    strong(v-if="info.licenseName"
      class="res-info__desc")
      span(class="pr-5") License:
      a(v-if="info.licenseLink"
        class="res-info__link__license pointer"
        :href="info.licenseLink"
        target="_blank"
        rel="nofollow noopener noreferrer"
        @mousedown.prevent) {{ info.licenseName }}
      span(v-else
        class="pl-5") {{ info.licenseName }}
    //- div(class="res-info__action")
    //-   svg-icon(:iconName="'folder'",
    //-     :iconColor="'gray-2'",
    //-     :iconWidth="'20px'")
    //-   span Add to My file
    //- div(class="res-info__action")
    //-   svg-icon(:iconName="'search'",
    //-     :iconColor="'gray-2'",
    //-     :iconWidth="'20px'")
    //-   span More ...
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
  .res-info {
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
      &__license {
        padding: 0;
      }
    }
    &__action {
      padding: 5px 0;
      font-size: 16px;
      display: flex;
      align-items: center;
    }
    &__desc {
      display: block;
      margin-top: 5px;
      margin-bottom: 5px;
    }
  }
</style>
