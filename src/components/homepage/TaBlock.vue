<template lang="pug">
div(class="block" :style="blockStyle")
  div(class="block-text" :style="blockTextStyle")
    div(class="block-text__title")
      span(v-html="content.title")
      img(v-for="(cb, index) in content.colorBlock.filter((i)=>!i.ref)"
        :key="`${cb.name}-${index}`"
        class="block__colorBlock"
        :src="require('@/assets/img/svg/color-block/' + cb.name)"
        :style="{ 'top': `${cb.top * rwdModifier}px`, 'left': `${cb.left * rwdModifier}px` }")
    div(class="block-text__description text-gray-2")
      span {{content.description}}
    div(v-if="content.link && content.link.text"
      class="block-text__link text-H5")
      router-link(:to="content.link.to")
        span {{content.link.text + ' →'}}
  div(class="block-animation")
    animation(:path="`${dir}/${locale}/${toFile}`"
      :lottieName="content.img.name.replace('.json', '')"
      :width="content.img.width * rwdModifier"
      :height="(content.img.height ? content.img.height : content.img.width) * rwdModifier")
    img(v-for="(cb, index) in content.colorBlock.filter((i)=>i.ref)"
      :key="`${cb.name}-${index}`"
      class="block__colorBlock"
      :src="require('@/assets/img/svg/color-block/' + cb.name)"
      :style="{ 'top': `${cb.top * rwdModifier}px`, 'left': `${cb.left * rwdModifier}px` }")
</template>

<script lang="ts">
import Animation from '@/components/Animation.vue'
import { IHomeBlockData } from '@/utils/homeBlockData'
import { defineComponent, PropType } from 'vue'
import { mapState } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'TaBlock',
  components: {
    Animation
  },
  props: {
    content: {
      type: Object as PropType<IHomeBlockData>,
      required: true
    }
  },
  computed: {
    ...mapState({
      isMobile: 'isMobile',
      isLargeDesktop: 'isLargeDesktop'
    }),
    blockStyle(): Record<string, string> {
      return {
        'flex-direction': this.isMobile ? 'column' : this.content.align
      }
    },
    blockTextStyle(): Record<string, string> {
      return {
        'align-items': this.content.align === 'column' ? 'center' : 'flex-start',
        'text-align': this.content.align === 'column' && !this.isMobile ? 'center' : 'left',
        width: (this.content.align === 'column' && !this.isMobile) ? '100%'
          : this.isMobile ? '327px' : !this.isLargeDesktop ? '360px' : '500px'
      }
    },
    rwdModifier() {
      return this.isLargeDesktop ? 1 : 0.7
    },
    locale(): string {
      return this.$i18n.locale
    },
    dir(): string {
      return this.content.img.name.endsWith('json')
        ? '/lottie'
        : '@/assets/img/svg/homepage'
    },
    toFile(): string {
      return this.content.img.name.endsWith('json')
        ? `${this.content.img.name.replace('.json', '')}/${this.content.img.name}`
        : `${this.content.img.name}`
    }
  }
})
</script>

<style lang="scss" scoped>
.block {
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: -webkit-sticky; // For safari < 13
  max-width: 100%;
  &__colorBlock {
    position: absolute;
    z-index: -1;
  }
}
.block-text {
  display: flex;
  flex-direction: column;
  position: -webkit-sticky; // For safari < 13
  margin-bottom: 10px;
  &__title {
    position: relative;
  }
  &__link {
    a {
      color: setColor(blue-1);
      text-decoration: none; // todo make a class
    }
  }
  div {
    margin-bottom: 10px;
  }
}
.block-animation {
  position: relative;
}
@media screen and (max-width: 768px) {
  .block {
    width: 375px;
    margin: 100px 0;
  }
  .block-text {
    &__title {
      @include text-H3;
    }
    &__description {
      @include body-MD;
    }
  }
}
@media screen and (max-width: 1440px) and (min-width: 768.02px) {
  .block {
    width: 768px;
    margin: 150px 0;
  }
  .block-text {
    &__title {
      @include text-H2;
    }
    &__description {
      @include body-LG;
    }
  }
}
@media screen and (min-width: 1440.02px) {
  .block {
    max-width: 1200px;
    margin: 150px 0;
  }
  .block-text {
    &__title {
      @include text-H2;
    }
    &__description {
      @include body-LG;
    }
  }
}
</style>
