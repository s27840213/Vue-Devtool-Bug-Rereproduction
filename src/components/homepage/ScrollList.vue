<template lang="pug">
div(class="list")
  div(class="list-title" :class="!isMobile ? 'text-H5' : 'text-H6'")
    span(class="list-title__text text-gray-1") {{title}}
    router-link(v-if="type !== 'theme'"
      class="list-title__more text-gray-2"
      :class="inBrowserMode ? 'body-MD' : 'body-SM'"
      :to="moreLink")
      span {{$t('NN0082')}}
  div(class="list-content")
    div(v-if="prevIcon"
      class="list-content__lefticon"
      @click="scroll(false)")
      svg-icon(iconName="chevron-left"
        iconWidth="25px"
        iconColor="gray-3")
    div(v-if="nextIcon"
      class="list-content__righticon"
      @click="scroll(true)")
      svg-icon(iconName="chevron-right"
        iconWidth="25px"
        iconColor="gray-3")
    div(class="list-content-items"
      :style="itemContainerStyles"
      @scroll.passive="updateIcon"
      ref="items")
      div(v-if="isLoading")
        svg-icon(iconName="loading"
          iconWidth="50px"
          iconColor="gray-3")
      //- type theme
      template(v-else-if="type === 'theme'")
        div(v-if="!$isTouchDevice()" class="list-content-items__theme-item")
          btn-new-design(v-slot="slotProps")
            img(class="list-content-items__theme-item-new pointer"
              :src="require('@/assets/img/svg/plus-origin.svg')"
              @click="slotProps.openPopup")
            span(class="body-XS text-gray-1") {{$t('NN0023')}}
        div(v-for="item in themeData"
          :key="item.id"
          class="list-content-items__theme-item")
          router-link(:to="themeRouteInfo(item)")
            img(class="list-content-items__theme-item-preset"
              :src="item.url.replace('v2','v3')"
              @error="imgOnerror"
              @click="openProductPageNotification(item)")
          span(class="body-XS text-gray-1") {{item.title}}
          span(v-if="!$isTouchDevice()" class="body-XXS text-gray-3") {{item.description}}
      //- type mydesign
      template(v-else-if="type === 'mydesign'")
        design-item(v-for="item in mydesignData"
          :key="item.id"
          class="list-content-items__mydesign-item"
          :config="item")
      //- type template
      template(v-else-if="type === 'template'")
        div(v-for="item in templateData" class="list-content-items__template-item"
            :key="item.id"
            @click="clickTemplate(item)")
          img(loading="lazy"
            :src="`https://template.vivipic.com/template/${item.match_cover.id}/${prevSize(item.match_cover)}?ver=${item.ver}`"
            :style="templateImgStyle(item.match_cover)")
          pro-item(v-if="item.plan === 1")
</template>

<script lang="ts">
import DesignItem from '@/components/homepage/DesignItem.vue'
import BtnNewDesign from '@/components/new-design/BtnNewDesign.vue'
import ProItem from '@/components/payment/ProItem.vue'
import { IAssetTemplate } from '@/interfaces/api'
import { Itheme } from '@/interfaces/theme'
import designUtils from '@/utils/designUtils'
import modalUtils from '@/utils/modalUtils'
import paymentUtils from '@/utils/paymentUtils'
import picWVUtils from '@/utils/picWVUtils'
import templateCenterUtils from '@/utils/templateCenterUtils'
import themeUtils from '@/utils/themeUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'ScrollList',
  components: {
    DesignItem,
    ProItem,
    BtnNewDesign
  },
  props: {
    type: {
      type: String,
      required: true
    },
    theme: {
      type: String
    },
    gridMode: {
      type: Boolean,
      default: false
    },
    /**
     * used only for template
     * plz see https://www.notion.so/vivipic/Vivipic-35c05fc6c7e04d509ab7eb7a0f393fe4
     */
    shuffle: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      prevIcon: false,
      nextIcon: false,
      isLoading: true,
      title: '',
      moreLink: '',
      fallbackSrc: require('@/assets/img/svg/image-preview.svg'),
      themeData: [] as Itheme[],
      templateData: [] as IAssetTemplate[]
    }
  },
  computed: {
    ...mapState({
      isMobile: 'isMobile'
    }),
    ...mapGetters({
      mydesignData: 'design/getAllDesigns',
      inBrowserMode: 'webView/getInBrowserMode',
      _newTemplateShownMode: 'getNewTemplateShownMode'
    }),
    itemContainerStyles() {
      return this.gridMode ? {
        display: 'grid',
        gridAutoColumns: this.$isTouchDevice() ? '72px' : '96px',
        columnGap: this.$isTouchDevice() ? '8px' : '24px',
        gridAutoFlow: 'column',
        gridTemplateRows: '1fr'
      } : {}
    },
  },
  created() {
    switch (this.type) {
      case 'theme':
        themeUtils.checkThemeState().then(() => {
          this.themeData = themeUtils.themesMainHidden
          this.isLoading = false
        })
        this.title = this.$t('NN0154') as string
        break
      case 'mydesign':
        this.fetchAllDesigns().then(() => {
          this.isLoading = false
        })
        this.title = this.$t('NN0080') as string
        this.moreLink = '/mydesign'
        break
      case 'template':
        Promise.all([
          this.getTamplate({
            keyword: 'group::0;;order_by::popular',
            theme: this.theme,
            shuffle: this.shuffle === true ? 1 : 0,
            cache: true
          }).then((response) => {
            this.templateData = response.data.content[0].list
          }),
          themeUtils.checkThemeState().then(() => {
            this.themeData = themeUtils.themesMainHidden
          })
        ]).then(() => {
          this.isLoading = false
        })
        this.title = themeUtils.getThemeTitleById(this.theme as string)
        this.moreLink = `/templates?themes=${this.theme}`
        break
    }
    this.delayInit()
  },
  methods: {
    ...mapActions({
      getTamplate: 'homeTemplate/getTagContent',
      fetchAllDesigns: 'design/fetchAllDesigns'
    }),
    imgOnerror(e: Event) {
      (e.target as HTMLImageElement).src = this.fallbackSrc
    },
    delayInit(retry = 10) {
      const items = this.$refs.items as HTMLElement
      if (items && items.scrollWidth !== items.offsetWidth) {
        this.updateIcon()
      } else if (retry > 0) {
        setTimeout(() => {
          this.delayInit(retry - 1)
        }, 1000)
      }
    },
    updateIcon() {
      const items = this.$refs.items as HTMLElement
      this.prevIcon = items.scrollLeft > 0
      this.nextIcon = items.scrollLeft < (items.scrollWidth - items.offsetWidth)
    },
    scroll(next: boolean) {
      const items = this.$refs.items as HTMLElement
      items.scrollLeft += items.offsetWidth / 2 * (next ? 1 : -1)
    },
    templateUrl(item: IAssetTemplate): string {
      const matchedTheme = this.themeData.find(theme => theme.id.toString() === item.match_cover.theme_id)
      return this.$router.resolve({
        name: 'Editor',
        query: {
          type: this.theme === '7' ? 'product-page-template' : 'new-design-template',
          design_id: this.theme === '7' ? item.group_id : item.match_cover.id,
          themeId: item.content_ids[0].themes.join(','),
          width: String(item.match_cover.width),
          height: String(item.match_cover.height),
          unit: matchedTheme?.unit ?? 'px',
          ...(matchedTheme?.unit !== 'px' && matchedTheme?.bleed !== undefined ? { bleeds: designUtils.convertBleedsToQuery(matchedTheme.bleed) } : {})
        }
      }).href
    },
    clickTemplate(item: IAssetTemplate) {
      if (this.$isTouchDevice() && this.theme === '7') {
        modalUtils.setModalInfo(
            `${this.$t('NN0808')}`,
            [],
            {
              msg: `${this.$t('NN0358')}`,
              class: 'btn-blue-mid',
              action: () => { return false }
            }
        )
        return
      }
      const template = templateCenterUtils.iAssetTemplate2Template(item, 4)
      if (!paymentUtils.checkProTemplate(template)) return
      picWVUtils.openOrGoto(this.templateUrl(item))
    },
    templateImgStyle(match_cover: IAssetTemplate['match_cover']): Record<string, string> {
      if (this._newTemplateShownMode) {
        const aspectRatio = match_cover.width / match_cover.height
        const widthLarger = aspectRatio >= 1
        const rectSize = 160
        // let height = this.theme === '3' ? 284
        //   : this.theme === '7' ? 320
        //     : 200
        let shownHeight = widthLarger ? rectSize : rectSize / aspectRatio
        let shownWidth = widthLarger ? rectSize * aspectRatio : rectSize
        if (this.$isTouchDevice()) {
          shownHeight *= 2 / 3
          shownWidth *= 2 / 3
        }

        return {
          height: `${shownHeight}px`,
          width: `${shownWidth}px`
        }
      } else {
        let height = this.theme === '3' ? 284
          : this.theme === '7' ? 320
            : 160
        if (this.$isTouchDevice()) {
          height *= 2 / 3
        }
        const aspectRatio = match_cover.width / match_cover.height
        return {
          height: `${height}px`,
          width: `${height * aspectRatio}px`
        }
      }
    },
    prevSize (match_cover: IAssetTemplate['match_cover']): string {
      const aspectRatio = match_cover.width / match_cover.height

      return aspectRatio > 1.7 ? 'prev_4x' : 'prev_2x'
    },
    themeRouteInfo(theme: Itheme) {
      if (this.$isTouchDevice() && theme.id === 7) {
        return ''
      } else {
        const queryBleed = theme.unit !== 'px' ? `&bleeds=${designUtils.convertBleedsToQuery(theme.bleed)}` : ''
        return `/editor?type=new-design-size&themeId=${theme.id}&width=${theme.width}&height=${theme.height}&unit=${theme.unit}${queryBleed}`
      }
    },
    openProductPageNotification(theme: Itheme) {
      if (this.$isTouchDevice() && theme.id === 7) {
        modalUtils.setModalInfo(
              `${this.$t('NN0808')}`,
              [],
              {
                msg: `${this.$t('NN0358')}`,
                class: 'btn-blue-mid',
                action: () => { return false }
              }
        )
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.list-title {
  display: flex;
  justify-content: space-between;
  padding: 8px;

  &__text {
    text-align: left;
  }
  &__more {
    text-decoration: none;
  }

  @media screen and (max-width: 768px) {
    padding: 8px 12px;
  }
}
.list-content {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  &__lefticon,
  &__righticon {
    position: absolute;
    cursor: pointer;
    z-index: 1;
  }
  &__lefticon {
    left: -30px;
  }
  &__righticon {
    right: -30px;
  }
}
.list-content-items {
  @include no-scrollbar;
  display: flex;
  align-items: flex-end;
  padding: 0 12px;
  overflow-x: scroll;
  overflow-y: hidden;
  scroll-behavior: smooth;
  gap: 8px;
  &__theme-item {
    display: grid;
    grid-template-rows: 1fr 36px;
    grid-template-columns: 1fr;
    row-gap: 4px;
    text-align: center;
    box-sizing: border-box;
    width: 100%;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: bottom;
      transition: all 0.2s ease-in-out;
    }

    span {
      line-clamp: 2;
      -webkit-line-clamp: 2;
      text-overflow: ellipsis;
    }

    img:hover {
      transform: translate(0, -5px);
    }

    @media screen and (max-width: 768px) {
      img:hover {
        transform: none;
      }
    }
  }
  &__app-theme-item {
    display: grid;
    grid-template-rows: 1fr 46px;
    grid-template-columns: 1fr;
    text-align: center;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: bottom;
    }

    span {
      line-clamp: 2;
      -webkit-line-clamp: 2;
      text-overflow: ellipsis;
    }
  }
  &__mydesign-item {
    min-width: 160px;
    margin: 8px;
  }
  &__template-item {
    margin: 8px 0px;
    position: relative;
    cursor: pointer;
    img {
      border: 1px solid setColor(gray-5);
      border-radius: 4px;
      overflow: hidden;
      box-sizing: border-box;
    }
    &:hover {
      transition: all 0.2s ease-in-out;
      transform: translate(0, -5px);
    }
    img:hover {
      box-shadow: 5px 5px 10px 2px rgba(48, 55, 66, 0.15);
    }

    @media screen and (max-width: 768px) {
      &:hover {
        transform: none;
      }
      img:hover {
        box-shadow: none;
      }
    }
  }
}
@media screen and (max-width: 768px) {
  .list-content-items__theme-item {
    &-new {
      width: 63px;
      height: 63px;
    }
    &-preset {
      width: 98px;
      height: 84px;
    }
  }
  .list-content__lefticon,
  .list-content__righticon {
    display: none;
  }
}
@media screen and (min-width: 768.02px) {
  .list-content-items__theme-item {
    &-new {
      width: 90px;
      height: 90px;
    }
    &-preset {
      width: 140px;
      height: 120px;
    }
  }
}
</style>
