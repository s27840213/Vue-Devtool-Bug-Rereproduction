<template lang="pug">
div(class="template-waterfall__wrapper")
  div(class="template-waterfall")
    div(v-for="waterfallTemplate in waterfallTemplates"
        class="template-waterfall__column")
      div(v-for="template in waterfallTemplate"
          class="template-waterfall__column__template"
          :style="templateStyles(template.aspect_ratio)"
          @click="handleClickWaterfall(template)"
          @mouseenter="handleMouseEnter(template.group_id)"
          @mouseleave="handleMouseLeave(template.group_id)")
        scrollable-template-preview(v-if="checkMouseEntered(template.group_id, template.group_type) && useScrollablePreview"
                                    :contentIds="template.content_ids")
        img(v-else class="template-waterfall__column__template__img" :src="template.url" loading="lazy")
        pro-item(v-if="template.plan === 1")
        div(v-if="template.group_type !== 1" class="template-waterfall__column__template__theme") {{ getThemeTitle(template.theme_id) }}
        div(v-if="template.content_ids.length > 1" class="template-waterfall__column__template__multi")
          svg-icon(iconName="multiple-file"
                  iconWidth="24px"
                  iconColor="gray-7")
  div(v-if="!isTemplateReady")
    svg-icon(iconName="loading"
            iconWidth="24px"
            iconColor="gray-2")
  observer-sentinel(v-if="isTemplateReady && hasNextPage"
                    @callback="handleLoadMore")
  div(v-if="useScrollSpace" class="template-waterfall__scroll-space")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ScrollableTemplatePreview from '@/components/templates/ScrollableTemplatePreview.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import ProItem from '@/components/payment/ProItem.vue'
import { mapGetters } from 'vuex'
import { ITemplate } from '@/interfaces/template'
import { Itheme } from '@/interfaces/theme'

export default defineComponent({
  props: {
    waterfallTemplates: {
      type: Array,
      required: true
    },
    isTemplateReady: {
      type: Boolean,
      required: true
    },
    useScrollablePreview: {
      type: Boolean,
      default: true
    },
    useScrollSpace: {
      type: Boolean,
      default: false
    },
    themes: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      mouseInTemplate: ''
    }
  },
  components: {
    ScrollableTemplatePreview,
    ObserverSentinel,
    ProItem
  },
  computed: {
    ...mapGetters('templates', {
      hasNextPage: 'hasNextPage'
    })
  },
  methods: {
    templateStyles(ratio: number) {
      return { paddingTop: `${ratio * 100}%` }
    },
    getThemeTitle(themeId: string): string {
      const theme = (this.themes as Itheme[]).find((theme) => theme.id.toString() === themeId)
      return theme ? theme.title : `${this.$t('NN0258')}`
    },
    handleLoadMore() {
      this.$emit('loadMore')
    },
    handleClickWaterfall(template: ITemplate) {
      this.$emit('clickWaterfall', template)
    },
    handleMouseEnter(id: string) {
      this.mouseInTemplate = id
    },
    handleMouseLeave(id: string) {
      if (this.mouseInTemplate === id) {
        this.mouseInTemplate = ''
      }
    },
    checkMouseEntered(id: string, groupType: number): boolean {
      return this.mouseInTemplate === id && groupType === 1
    }
  }
})
</script>

<style lang="scss" scoped>
.template-waterfall {
  display: flex;
  gap: 24px;
  @media screen and (max-width: 540px) {
    gap: 15px;
    padding: 2px;
  }
  &__wrapper {
    padding-bottom: 80px;
  }
  &__column {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    @media screen and (max-width: 540px) {
      gap: 15px;
    }
    &__template {
      position: relative;
      width: 100%;
      border: 1px solid setColor(gray-5);
      overflow: hidden;
      cursor: pointer;
      &__img {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
      }
      &__theme {
        position: absolute;
        bottom: -20px;
        left: 0;
        width: 100%;
        height: 20px;
        background-color: rgba(238, 239, 244, 0.8);
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        color: setColor(gray-2);
        text-align: left;
        padding: 0;
        padding-left: 8px;
        transition: 0.2s ease;
      }
      &:hover &__theme {
        bottom: 0;
      }
      &__multi {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 24px;
        height: 24px;
      }
    }
  }
  &__scroll-space {
    height: 10vh;
    width: 100%;
  }
}
</style>
