<template lang="pug">
  div(class="page-setting")
    div(class="page-setting__title")
      span(class="text-blue-1 label-lg") Page Setting
    div(class="page-setting__size")
      property-bar
        input(class="body-2 text-gray-2" min="0" v-model="pageWidth")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
      svg-icon(class="pointer"
          :iconName="'unlock'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        input(class="body-2 text-gray-2" min="0" v-model="pageHeight")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
    div
      span(class="test text-gray-1 label-lg") All Format
    search-bar(:placeholder="'search'")
    div(class="page-setting__formats")
      property-bar(class="p-10 pointer"
          v-for="(format,index) in formatPresets"
          :key="`format-${index}`"
          class="page-setting__format"
          @click.native="setPageSize(format)")
        span(class="text-blue-1 label-md text-bold") {{format.name}}
        span(class="text-gray-3 body-2") {{`${format.width}x${format.height} px`}}
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { mapGetters, mapMutations } from 'vuex'
import StepsUtils from '@/utils/stepsUtils'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      formatPresets: [
        {
          name: 'Facebook Post',
          width: 940,
          height: 788
        },
        {
          name: 'Instagram Post',
          width: 1080,
          height: 1080
        },
        {
          name: 'Instagram  Story',
          width: 1080,
          height: 1920
        },
        {
          name: 'LOGO',
          width: 512,
          height: 512
        },
        {
          name: 'Google Ads',
          width: 1080,
          height: 1080
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      lastSelectedPageIndex: 'getLastSelectedPageIndex'
    }),
    pageWidth: {
      get(): number {
        return this.getPage(this.lastSelectedPageIndex).width
      },
      set(value): void {
        this.$store.commit('UPDATE_pageProps', {
          pageIndex: this.lastSelectedPageIndex,
          props: {
            width: value
          }
        })
        StepsUtils.record()
      }
    },
    pageHeight: {
      get(): number {
        return this.getPage(this.lastSelectedPageIndex).height
      },
      set(value): void {
        this.$store.commit('UPDATE_pageProps', {
          pageIndex: this.lastSelectedPageIndex,
          props: {
            height: value
          }
        })
        StepsUtils.record()
      }
    }
  },
  methods: {
    ...mapMutations({
      updatePageProps: 'UPDATE_pageProps'
    }),
    setPageSize(format: { name: string, width: number, height: number }) {
      this.updatePageProps({
        pageIndex: this.lastSelectedPageIndex,
        props: {
          width: format.width,
          height: format.height
        }
      })
      StepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.page-setting {
  @include size(100%, 100%);
  text-align: left;
  &__title {
    text-align: center;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }

  &__size {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: auto;
    column-gap: 5px;
    align-items: center;
  }

  &__formats {
    display: flex;
    flex-direction: column;
    > div {
      margin-bottom: 8px;
    }
  }
}
</style>
