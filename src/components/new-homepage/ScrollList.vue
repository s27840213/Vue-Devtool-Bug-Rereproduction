<template lang="pug">
  div(class="list")
    div(class="list-title text-H5")
      span {{title}}
      router-link(v-if="type !== 'theme'"
        class="list-title__more body-MD text-gray-2"
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
        @scroll="updateIcon"
        ref="items")
        //- type theme
        template(v-if="type === 'theme'")
          div(class="list-content-items__theme-item")
            img(:src="require('@/assets/img/png/plus-origin.png')"
              @click="$emit('openSizePopup')")
            span(class="body-SM text-gray-1") {{$t('NN0023')}}
          div(v-for="item in themeData"
            class="list-content-items__theme-item")
            router-link(:to="`/editor?type=new-design-size&themeId=${item.id}&width=${item.width}&height=${item.height}`")
              img(:src="item.url"
                @error="imgOnerror")
            span(class="body-SM text-gray-1") {{item.title}}
            span(class="body-XS text-gray-3") {{item.width}} x {{item.height}}
        //- type mydesign
        template(v-if="type === 'mydesign'")
          design-item(v-for="item in mydesignData"
            class="list-content-items__mydesign-item"
            :config="item")
        //- type template
        template(v-if="type === 'template'")
          div(v-for="item in templateData"
            class="list-content-items__template-item")
            router-link(:to="`/editor?type=new-design-template&design_id=${item.match_cover.id}&width=${item.match_cover.width}&height=${item.match_cover.height}`" target="_blank")
              img(loading="lazy"
                :src="`https://template.vivipic.com/template/${item.match_cover.id}/prev_2x?ver=${item.ver}`"
                :style="templateImgStyle")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
import i18n from '@/i18n'
import DesignItem from '@/components/homepage/DesignItem.vue'
import themeUtils from '@/utils/themeUtils'
import designUtils from '@/utils/designUtils'
import _ from 'lodash'

export default Vue.extend({
  name: 'ScrollList',
  components: {
    DesignItem
  },
  props: {
    type: {
      type: String,
      required: true
    },
    theme: {
      type: String
    }
  },
  data() {
    return {
      initialed: false,
      prevIcon: false,
      nextIcon: false,
      title: '',
      moreLink: '',
      fallbackSrc: require('@/assets/img/svg/image-preview.svg'),
      themeData: [],
      templateData: [],
      templateTitle: {
        '1,2': i18n.t('NN0368'),
        3: i18n.t('NN0026'),
        8: i18n.t('NN0151', { media: 'Facebook' }),
        6: i18n.t('NN0028'),
        5: i18n.t('NN0027'),
        7: i18n.t('NN0369'),
        9: i18n.t('NN0370')
      } as Record<string, string>
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin',
      mydesignData: 'design/getAllDesigns',
      isDesignsLoading: 'design/getIsDesignsLoading'
    }),
    templateImgStyle():Record<string, string> {
      return ['3', '7'].includes(this.theme)
        ? { 'max-width': '160px' }
        : { 'max-height': '160px' }
    }
  },
  created() {
    switch (this.type) {
      case 'theme':
        themeUtils.checkThemeState().then(() => {
          this.themeData = _.filter(themeUtils.themes, ['mainHidden', 0])
        })
        this.title = i18n.t('NN0154') as string
        break
      case 'mydesign':
        designUtils.fetchDesigns(this.fetchAllDesigns) // 如果不檢查有沒有登入？
        this.title = i18n.t('NN0080') as string
        this.moreLink = '/mydesign'
        break
      case 'template':
        this.getTamplate({
          keyword: 'group::0;;order_by::popular',
          theme: this.theme,
          cache: true
        }).then((response) => {
          this.templateData = response.data.content[0].list
        })
        this.title = this.templateTitle[this.theme]
        this.moreLink = `/templates?themes=${this.theme}`
        break
    }
  },
  async mounted() {
    //
  },
  updated() {
    if (this.initialed) {
      return
    }
    this.updateIcon()
    this.initialed = true
  },
  methods: {
    ...mapActions({
      getTamplate: 'homeTemplate/getTagContent',
      fetchAllDesigns: 'design/fetchAllDesigns'
    }),
    imgOnerror(e: Event) { // what type
      (e.target as HTMLImageElement).src = this.fallbackSrc
    },
    updateIcon() {
      const items = this.$refs.items as HTMLElement
      this.prevIcon = items.scrollLeft > 0
      this.nextIcon = items.scrollLeft < (items.scrollWidth - items.offsetWidth)
    },
    scroll(next: boolean) {
      const items = this.$refs.items as HTMLElement
      items.scrollLeft += items.offsetWidth / 2 * (next ? 1 : -1)
    }
  }
})
</script>

<style lang="scss" scoped>
.list {
  &-title {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    &__more {
      text-decoration: none;
    }
  }
  &-content {
    display: flex;
    position: relative;
    align-items: center;
    width: 80vw; // ask kitty
    &__lefticon, &__righticon {
      position: absolute;
      cursor: pointer;
    }
    &__lefticon {
      left: -30px;
    }
    &__righticon {
      right: -30px;
    }
    &-items {
      display: flex;
      align-items: center;
      overflow: auto;
      scroll-behavior: smooth;
      @include no-scrollbar;
      &__theme-item {
        display: flex;
        flex-direction: column;
        text-align: center;
        padding: 8px 12px;
        a {
          width: 140px;
          height: 120px;
        }
        img {
          width: 100px;
          height: 100px;
          &:hover {
            transition: all 0.2s ease-in-out;
            transform: translate(0, -5px);
          }
        }
      }
      &__mydesign-item {
        min-width: 160px;
        margin: 8px;
      }
      &__template-item {
        margin: 8px;
        img {
          &:hover {
            transition: all 0.2s ease-in-out;
            box-shadow: 5px 5px 10px 2px rgba(48, 55, 66, 0.15);
            transform: translate(0, -5px);
          }
        }
      }
    }
  }
}
</style>
