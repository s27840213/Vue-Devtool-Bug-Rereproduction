<template lang="pug">
  div(class="page-setting")
    div(class="page-setting__title")
      span(class="text-blue-1 label-lg") Page Setting
    div(class="page-setting__size")
      property-bar
        input(class="body-2 text-gray-2"  type="number" min="0" v-model.number="pageWidth")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
      svg-icon(class="pointer"
          :iconName="isLocked ? 'lock' : 'unlock'" :iconWidth="'20px'" :iconColor="'gray-2'"
          @click.native="toggleLock()")
      property-bar
        input(class="body-2 text-gray-2"  type="number" min="0" v-model.number="pageHeight")
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
    div(v-if="inAdminMode")
      span(class="text-gray-1 label-lg") Template Information
      div(class="template-information__content")
        div(class="template-information__line" style="background: #eee;")
          span(class="body-1") focus
          span(class="pl-15 body-2" @click="copyText(key_id)") {{key_id}}
        btn(:type="'primary-sm'" class="rounded my-5" style="padding: 8px 40px;"
          @click.native="getDataClicked()") 取得模板資料
        div(class="template-information__line")
          span(class="body-1") key_id
          span(class="pl-15 body-2" @click="copyText(templateInfo.key_id)") {{templateInfo.key_id}}
        div(class="template-information__line")
          span(class="body-1") 作者
          span(class="pl-15 body-2" @click="copyText(templateInfo.author)") {{templateInfo.author}}
        div(class="template-information__line")
          span(class="body-1") 上次更新
          span(class="pl-15 body-2") {{templateInfo.edit_time}}
        div(class="template-information__line")
          span(class="body-1") 語系
          select(class="template-information__select" v-model="templateInfo.locale")
            option(v-for="locale in localeOptions" :value="locale") {{locale}}
        div
          span tags_tw
        div
          property-bar
            input(class="body-2 text-gray-2" min="0" v-model="templateInfo.tags_tw")
        div
          span tags_us
        div
          property-bar
            input(class="body-2 text-gray-2" min="0" v-model="templateInfo.tags_us")
        div
          span tags_jp
        div
          property-bar
            input(class="body-2 text-gray-2" min="0" v-model="templateInfo.tags_jp")
        div(class="template-information__line")
          div(style="width: 50%;")
            input(type="checkbox" class="template-information__check" v-model="updateChecked")
            label 確定更新
          btn(:type="'primary-sm'" class="rounded my-5"
          style="padding: 5px 40px;" @click.native="updateDataClicked()") 更新
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import StepsUtils from '@/utils/stepsUtils'
import designApis from '@/apis/design-info'
import GeneralUtils from '@/utils/generalUtils'

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
      ],
      isLocked: true,
      isLoading: false,
      needUpdate: false,
      updateChecked: false,
      localeOptions: ['tw', 'us', 'jp'],
      currentKeyId: '',
      templateInfo: {
        key_id: '' as string,
        author: '' as string,
        edit_time: '' as string,
        tags_tw: '' as string,
        tags_us: '' as string,
        tags_jp: '' as string,
        locale: '' as string
      }
    }
  },
  watch: {
    key_id: function() {
      this.templateInfo = {
        key_id: '',
        author: '',
        edit_time: '',
        tags_tw: '',
        tags_us: '',
        tags_jp: '',
        locale: ''
      }
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapGetters({
      getPage: 'getPage',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      token: 'user/getToken',
      getAsset: 'getAsset'
    }),
    pageWidth: {
      get(): number {
        return Math.round(this.getPage(this.lastSelectedPageIndex).width)
      },
      set(value: number): void {
        if (this.isLocked) {
          this.$store.commit('UPDATE_pageProps', {
            pageIndex: this.lastSelectedPageIndex,
            props: {
              width: value,
              height: value / this.aspectRatio
            }
          })
          StepsUtils.record()
        } else {
          this.$store.commit('UPDATE_pageProps', {
            pageIndex: this.lastSelectedPageIndex,
            props: {
              width: value
            }
          })
          StepsUtils.record()
        }
      }
    },
    pageHeight: {
      get(): number {
        return Math.round(this.getPage(this.lastSelectedPageIndex).height)
      },
      set(value: number): void {
        if (this.isLocked) {
          this.$store.commit('UPDATE_pageProps', {
            pageIndex: this.lastSelectedPageIndex,
            props: {
              height: value,
              width: value * this.aspectRatio
            }
          })
          StepsUtils.record()
        } else {
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
    aspectRatio(): number {
      return this.getPage(this.lastSelectedPageIndex).width / this.getPage(this.lastSelectedPageIndex).height
    },
    inAdminMode(): boolean {
      return this.role === 0 && this.adminMode === true
    },
    key_id(): string {
      return this.getPage(this.lastSelectedPageIndex).designId
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
    },
    toggleLock() {
      this.isLocked = !this.isLocked
    },
    async getDataClicked() {
      this.isLoading = true
      if (this.key_id.length === 0) {
        this.isLoading = false
        this.$notify({ group: 'copy', text: '找不到模板資料' })
        return
      }
      this.updateChecked = false
      this.needUpdate = true
      const data = {}
      const res = await designApis.getTemplateInfo(this.token, 'template', this.key_id, 'select', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.templateInfo = res.data.data
        this.templateInfo.edit_time = this.templateInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
      } else {
        this.$notify({ group: 'copy', text: '找不到模板資料' })
      }

      this.isLoading = false
    },
    async updateDataClicked() {
      this.isLoading = true
      if (!this.templateInfo.key_id) {
        this.isLoading = false
        this.$notify({ group: 'copy', text: '請先取得模板資料' })
        return
      }
      if (!this.updateChecked) {
        this.isLoading = false
        this.$notify({ group: 'copy', text: '請先勾選確定更新' })
        return
      }
      const data = {
        locale: this.templateInfo.locale,
        tags_tw: this.templateInfo.tags_tw,
        tags_us: this.templateInfo.tags_us,
        tags_jp: this.templateInfo.tags_jp
      }
      const res = await designApis.updateTemplateInfo(this.token, 'template', this.templateInfo.key_id, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.$notify({ group: 'copy', text: '模板資料更新成功' })
        this.templateInfo = res.data.data
        this.templateInfo.edit_time = this.templateInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
      }
      this.updateChecked = false
      this.isLoading = false
    },
    copyText(text: string) {
      if (text.length === 0) {
        return
      }
      GeneralUtils.copyText(text)
        .then(() => {
          this.$notify({ group: 'copy', text: `${text} 已複製` })
        })
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

.template-information {
  &__content {
    display: grid;
    row-gap: 8px;
    padding-bottom: 25px;
  }
  &__line {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__select {
    width: 40%;
    height: 35px;
    font-size: 18px;
    border: 1px solid #d9dbe1;
    padding-left: 15px;
  }
  &__check {
    width: 10%;
  }
}
</style>
