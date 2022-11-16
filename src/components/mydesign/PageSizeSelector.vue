<template lang="pug">
  div(class="page-size-selector")
    div(v-if="isMobile" class="page-size-selector__body-row first-row")
      span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0023')}}
    div(class="page-size-selector__body-row")
      div(class="page-size-selector__body__custom")
        property-bar(class="page-size-selector__body__custom__box"
                    :class="(selectedFormatKey === 'custom' ? 'border-black-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`) + (isValidate ? widthValid ? '' : ' input-invalid' : '')")
          input(class="body-3" type="number" min="0" ref="inputWidth"
                :class="(selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor)"
                :value="pageWidth || null" :placeholder="isMobile ? $t('NN0320') : $t('NN0163', {term: $t('NN0320')})" @click="selectFormat('custom')" @input="setPageWidth")
          span(class="body-4 page-size-selector__body__custom__box__input-label"
              :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor") W
        svg-icon(class="pointer"
            :iconName="isLocked ? 'lock' : 'unlock'"
            iconWidth="20px" :iconColor="!isLockDisabled ? (selectedFormatKey === 'custom' ? 'black' : (isDarkTheme ? 'white' : 'gray-4')) : 'gray-4'"
            @click.native="toggleLock()")
        property-bar(class="page-size-selector__body__custom__box"
                    :class="(selectedFormatKey === 'custom' ? 'border-black-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`) + (isValidate ? heightValid ? '' : ' input-invalid' : '')")
          input(class="body-3" type="number" min="0"
                :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor"
                :value="pageHeight || null" :placeholder="isMobile ? $t('NN0319') : $t('NN0163', {term: $t('NN0319')})" @click="selectFormat('custom')" @input="setPageHeight")
          span(class="body-4 page-size-selector__body__custom__box__input-label"
              :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor") H
        div(v-if="isValidate && !isCustomValid"
          class="page-size-selector__body__custom__err text-red") {{errorMsg}}
    div(class="page-size-selector__body__hr horizontal-rule bg-gray-4")
    div(class="page-size-selector__container")
        div(class="page-size-selector__body-row first-row")
          span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0024')}}
        div(v-if="!isLayoutReady" class="page-size-selector__body-row-center")
          svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" :iconColor="defaultTextColor")
        div(v-for="(format, index) in recentlyUsed" class="page-size-selector__body-row item pointer"
            @click="selectFormat(`recent-${index}`)")
          radio-btn(class="page-size-selector__body-row__radio"
                    :isSelected="selectedFormatKey === `recent-${index}`",
                    :circleColor="isDarkTheme ? 'white' : 'light-gray'"
                    :formatKey="`recent-${index}`",
                    @select="selectFormat")
          div(class="page-size-selector__body-row__content")
            span(class="page-size-selector__body__recently body-3 pointer"
                  :class="selectedFormatKey === `recent-${index}` ? 'text-black' : defaultTextColor") {{ isMobile ? format.title : makeFormatString(format) }}
            span(v-if="isMobile" class="page-size-selector__body__typical body-3"
                  :class="selectedFormatKey === `preset-${index}` ? 'text-black' : defaultTextColor") {{ isMobile ? format.description :makeFormatString(format)}}
        div(class="page-size-selector__body-row first-row")
          span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0025')}}
        div(v-if="!isLayoutReady" class="page-size-selector__body-row-center")
          svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" :iconColor="defaultTextColor")
        div(v-for="(format, index) in formatList" class="page-size-selector__body-row item pointer"
            @click="selectFormat(`preset-${index}`)")
          radio-btn(class="page-size-selector__body-row__radio"
                    :isSelected="selectedFormatKey === `preset-${index}`",
                    :circleColor="isDarkTheme ? 'white' : 'light-gray'"
                    :formatKey="`preset-${index}`",
                    @select="selectFormat")
          div(class="page-size-selector__body-row__content")
            span(class="page-size-selector__body__typical body-3"
                  :class="selectedFormatKey === `preset-${index}` ? 'text-black' : defaultTextColor") {{ isMobile ? format.title : makeFormatString(format)}}
            span(v-if="isMobile" class="page-size-selector__body__typical body-3"
                  :class="selectedFormatKey === `preset-${index}` ? 'text-black' : defaultTextColor") {{ isMobile ? format.description : makeFormatString(format)}}
</template>

<script lang="ts">
import Vue from 'vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { ILayout } from '@/interfaces/layout'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
// TODO: merge with @/components/editor/PageSizeSelector.vue

export default Vue.extend({
  props: {
    isDarkTheme: {
      type: Boolean,
      default: false
    },
    isValidate: {
      type: Boolean,
      default: false
    },
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  components: {
    RadioBtn
  },
  mounted() {
    this.fetchLayouts();
    (this.$refs.inputWidth as HTMLInputElement).focus()
  },
  data() {
    return {
      selectedFormatKey: 'custom',
      pageWidth: NaN,
      pageHeight: NaN,
      aspectRatio: 1,
      isLocked: false,
      errorMsg: '',
      formatList: new Array<ILayout>(),
      recentlyUsed: new Array<ILayout>(),
      isLayoutReady: false
    }
  },
  watch: {
    isValidate() {
      if (this.selectedFormatKey === 'custom' && this.isValidate && !this.isCustomValid) {
        // TODO: translate
        this.errorMsg = '請輸入大於 0 的數字'
      }
    },
    selectedFormat(layout: ILayout) {
      this.$emit('select', layout)
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapState(
      'layouts',
      [
        'categories'
      ]
    ),
    ...mapGetters({
      getPage: 'getPage',
      token: 'user/getToken',
      getAsset: 'getAsset',
      groupId: 'getGroupId',
      groupType: 'getGroupType',
      pagesLength: 'getPagesLength',
      getPageSize: 'getPageSize'
    }),
    isCustomValid(): boolean {
      return this.widthValid && this.heightValid
    },
    defaultTextColor(): string {
      return this.isDarkTheme ? 'text-white' : 'text-gray-3'
    },
    isFormatApplicable(): boolean {
      return this.selectedFormatKey === 'custom' ? this.isCustomValid : (this.selectedFormatKey !== '')
    },
    widthValid(): boolean {
      return !!this.pageWidth && this.pageWidth > 0
    },
    heightValid(): boolean {
      return !!this.pageHeight && this.pageHeight > 0
    },
    isLockDisabled(): boolean {
      return this.selectedFormatKey !== 'custom' || !this.isCustomValid
    },
    selectedFormat(): ILayout | undefined {
      if (this.selectedFormatKey === 'custom') {
        if (!this.isCustomValid) return undefined
        return { id: '', width: this.pageWidth as number, height: this.pageHeight as number, title: '', description: '' }
      } else if (this.selectedFormatKey.startsWith('recent')) {
        const [type, index] = this.selectedFormatKey.split('-')
        const format = this.recentlyUsed[parseInt(index)]
        return format
      } else if (this.selectedFormatKey.startsWith('preset')) {
        const [type, index] = this.selectedFormatKey.split('-')
        const format = this.formatList[parseInt(index)]
        return format
      } else {
        return undefined
      }
    }
  },
  methods: {
    ...mapMutations({
      updateRecentlyUsed: 'layouts/UPDATE_RECENTLY_PAGE'
    }),
    ...mapActions('layouts',
      [
        'getRecently'
      ]
    ),
    toggleLock() {
      if (this.isLockDisabled) return
      this.isLocked = !this.isLocked
      if (this.isLocked) {
        this.aspectRatio = (this.pageWidth ?? 1) / (this.pageHeight ?? 1)
      }
    },
    makeFormatString(format: ILayout) {
      if (format.id !== '') {
        return `${format.title} ${format.description}`
      } else {
        return `${format.width} x ${format.height}`
      }
    },
    setPageWidth(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageWidth = parseInt(value)
      if (this.isLocked) {
        if (value === '') {
          this.pageHeight = NaN
        } else {
          this.pageHeight = Math.round(parseInt(value) / this.aspectRatio)
        }
      }
    },
    setPageHeight(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageHeight = parseInt(value)
      if (this.isLocked) {
        if (value === '') {
          this.pageWidth = NaN
        } else {
          this.pageWidth = Math.round(parseInt(value) * this.aspectRatio)
        }
      }
    },
    selectFormat(key: string) {
      this.selectedFormatKey = key
    },
    fetchLayouts() {
      this.isLayoutReady = false
      this.formatList = []
      this.recentlyUsed = []
      this.getRecently().then(() => {
        for (const category of this.categories as IListServiceContentData[]) {
          if (category.title === `${this.$t('NN0025')}`) {
            this.formatList = category.list.map(item => ({
              id: item.id,
              width: item.width ?? 0,
              height: item.height ?? 0,
              title: item.title ?? '',
              description: item.description ?? ''
            }))
          }
          if (category.title === `${this.$t('NN0024')}`) {
            this.recentlyUsed = category.list.map(item => ({
              id: item.id,
              width: item.width ?? 0,
              height: item.height ?? 0,
              title: item.title ?? '',
              description: item.description ?? ''
            }))
          }
        }
        if (this.formatList.length > 0) {
          this.isLayoutReady = true
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.page-size-selector {
  height: 100%;
  text-align: left;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  &__body {
    background-color: setColor(gray-1-5);
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.25);
    border-radius: 4px;
    padding: 11.57px;
    &-row {
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      width: 100%;
      margin-left: auto;
      margin-top: 15px;
      margin-right: auto;
      align-items: center;
      &-center {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      &.first-row {
        display: block;
        margin-top: 0px;
        // font-family: 'SF Pro';
        color: setColor(gray-2);
        letter-spacing: 1.5px;
      }
      &.item {
        display: grid;
        margin: 0px;
        padding: 2px 16px;
        grid-template-columns: 28px 1fr;
        justify-content: left;
        // font-family: 'Mulish';
      }
      &__radio {
        height: 24px;
        display: flex;
        align-items: center;
      }
      &__content {
        height: 24px;
        display: grid;
        grid-template-columns: auto auto;
        align-items: center;
        justify-content: space-between;
        white-space: nowrap;
        line-height: 20px;
      }
    }
    &__title {
      font-weight: 700;
    }
    &__custom {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      grid-template-rows: auto;
      column-gap: 15px;
      align-items: center;
      &__box {
        height: 30px;
        box-sizing: border-box;
        padding: 5px 5px;
        &__input-label {
          width: 30px;
          // font-family: 'Manrope';
          font-weight: 700;
          text-align: center;
        }
        & input {
          background-color: transparent;
          // font-family: 'Mulish';
          &::placeholder {
            /* Chrome, Firefox, Opera, Safari 10.1+ */
            color: setColor(gray-3);
            opacity: 1; /* Firefox */
          }
          &:-ms-input-placeholder {
            /* Internet Explorer 10-11 */
            color: setColor(gray-3);
          }
          &::-ms-input-placeholder {
            /* Microsoft Edge */
            color: setColor(gray-3);
          }
        }
      }
      &__err{
        grid-column: 1 / 4;
      }
    }
    &__hr {
      width: 100%;
      margin-top: 20px;
      margin-bottom: 20px;
    }
  }
  &__container {
    display: grid;
    gap: 4px;
    overflow-y: auto; // overlay is not supported in Firefox
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background-color: setColor(gray-3);
    }
  }
}
.horizontal-rule {
  height: 1px;
  margin-left: auto;
  margin-right: auto;
  padding: 0;
}

.input-invalid {
  border: 1px solid setColor(red) !important;
}

@media screen and (max-width: 540px) {
  .page-size-selector__body-row {
    padding: 0px 8px;
  }

  .page-size-selector__body-row.item {
    padding: 4px 16px;
  }
}
</style>
