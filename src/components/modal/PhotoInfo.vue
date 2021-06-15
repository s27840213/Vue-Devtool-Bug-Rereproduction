<template lang="pug">
  div(class="photo-info")
    strong(class="photo-info__desc")
      span Photo by
      span(class="photo-info__link pointer"
        :data-link="user.link"
        @click="handleLink") {{ user.name }}
      span on
      span(class="photo-info__link pointer"
        :data-link="vendor.link"
        @click="handleLink") {{ vendor.name }}
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
    user () {
      const { userName, userLink } = this.info || {}
      return {
        name: userName || '',
        link: userLink || ''
      }
    },
    vendor () {
      const { vendorName, vendorLink } = this.info || {}
      return {
        name: vendorName || '',
        link: vendorLink || ''
      }
    },
    tags () {
      const { tags } = this.info || {}
      return [...tags]
    }
  },
  methods: {
    handleLink (evt: Event) {
      const linkTarget = evt.target as HTMLSpanElement
      const { link } = linkTarget.dataset
      link && window.open(link, '_blank')
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
