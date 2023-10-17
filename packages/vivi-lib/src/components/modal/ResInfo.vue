<template lang="pug">
div(class="res-info")
  strong(v-if="info.userName || info.vendor"
    class="res-info__desc")
    i18n-t(v-if="info.type === 'photo'"
      keypath="NN0364" tag="span")
        template(#author)
          a(v-if="info.userLink"
            class="res-info__link pointer"
            :href="userLink"
            target="_blank"
            rel="nofollow noopener noreferrer"
            @mousedown.prevent)
            span {{ info.userName }}
        template(#site)
          a(v-if="info.vendor && vendorLink"
            class="res-info__link pointer"
            :href="vendorLink"
            target="_blank"
            rel="nofollow noopener noreferrer"
            @mousedown.prevent) {{ info.vendor }}
          span(v-else
            class="pl-5") {{ info.vendor }}
    i18n-t(v-else
      keypath="NN0365" tag="span")
        template(#author)
          a(v-if="info.userLink"
            class="res-info__link pointer"
            :href="userLink"
            target="_blank"
            rel="nofollow noopener noreferrer"
            @mousedown.prevent)
            span {{ info.userName }}
            span {{info.authorCompany ? ', ' + info.authorCompany : ''}}
          template(v-else)
            span(class="px-5") {{ ' ' + info.userName }}
            span(class="px-5") {{info.authorCompany ? ', ' + info.authorCompany : ''}}
  div(v-if="info.tags && info.tags.length"
    class="res-info__tags")
    span(class="pr-5") {{$t('NN0366')}}:
    template(v-for="tag, idx in info.tags" :key="tag")
      span(v-if="idx !== 0") {{' '}}
      span(class="res-info__link __tag"
        @click="onTagClicked(tag)") {{ tag }}
  strong(v-if="info.licenseName"
    class="res-info__desc")
    span(class="pr-5") {{$t('NN0367')}}:
    a(v-if="info.licenseLink"
      class="res-info__link __license pointer"
      :href="info.licenseLink"
      target="_blank"
      rel="nofollow noopener noreferrer"
      @mousedown.prevent) {{ info.licenseName }}
    span(v-else) {{ info.licenseName }}
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
import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'

const moduleName = 'unsplash'

export default defineComponent({
  emits: [],
  props: {
    info: {
      type: Object,
      required: true
    }
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
  },
  methods: {
    ...mapActions('objects',
      [
        'getTagContent'
      ]
    ),
    ...mapMutations({
      setDropdown: 'popup/SET_STATE',
      _setCurrSelectedResInfo: 'SET_currSelectedResInfo'
    }),
    async onTagClicked(tag: string) {
      console.log(tag)
      this._setCurrSelectedResInfo({})
      const keyword = tag
      const { type } = this.info as any
      switch (type) {
        case 'photo':
          await this.$store.commit(`${moduleName}/SET_STATE`, {
            keyword: keyword,
            list: []
          })
          this.$store.dispatch(`${moduleName}/getPhotos`, { keyword })
          break
        case 'object':
          this.getTagContent({ keyword })
          break
        default:
          break
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
      cursor: pointer;
      color: #009fc5;
      padding: 0 5px;
      text-decoration: underline;
      &.__tag, &.__license {
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
