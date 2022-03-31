<template lang="pug">
  div(class="block"
    :style="blockStyle")
    div(class="block-text"
      :style="blockTextStyle")
      div(v-if="content.comingSoon"
        class="block-text__coming_soon overline-SM")
        span {{'COMING SOON'}}
      div(class="block-text__title")
        i18n(:path="content.title" tag="span")
          template(#newline)
            br
        img(v-for="cb in content.colorBlock"
          v-if="!cb.ref"
          class="block__colorBlock"
          :src="require('@/assets/img/svg/newHomepage/' + cb.name)"
          :style="{ 'top': `${cb.top * rwdModifier}px`, 'left': `${cb.left * rwdModifier}px` }")
      div(class="block-text__description text-gray-2")
        span {{$t(content.description)}}
      //- need v-if?
      div(v-if="content.link"
        class="block-text__link text-H5")
        router-link(:to="content.link.to")
          span {{$t(content.link.text)+ ' →'}}
    div(class="block-img")
      animation(
        :path="`${dir}/${locale}/${content.img.name}`"
        :width="content.img.width * rwdModifier"
        :height="(content.img.height ? content.img.height : content.img.width) * rwdModifier")
      img(v-for="cb in content.colorBlock"
        v-if="cb.ref==='img'"
        class="block__colorBlock"
        :src="require('@/assets/img/svg/newHomepage/' + cb.name)"
        :style="{ 'top': `${cb.top * rwdModifier}px`, 'left': `${cb.left * rwdModifier}px` }")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import i18n from '@/i18n'
import Animation from '@/components/Animation.vue'

export default Vue.extend({
  name: 'Block', // need rename
  components: {
    Animation
  },
  props: {
    content: {
      type: Object, // redefine a interface
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
    locale():string {
      return i18n.locale
    },
    dir(): string {
      return this.content.img.name.endsWith('json')
        ? '/lottie'
        : '@/assets/img/svg/newHomepage'
    }
  }
})
</script>

<style lang="scss" scoped>
.block {
  display: flex;
  justify-content: space-around;
  align-items: center;
  &__colorBlock {
    position: absolute;
    z-index: -1;
  }
}
.block-text {
  display: flex;
  flex-direction: column;
  max-width: 700px;
  &__coming_soon {
    padding: 4px;
    color: white;
    background: #FFBA49;
    border-radius: 4px;
  }
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
    margin: 0 0 10px;
  }
}
.block-img {
  position: relative;
  // z-index: -2;
}
@media screen and (max-width: 768px) {
  .block{
    width: 375px;
    margin: 100px 0;
  }
  .block-text{
    &__title {
      @include text-H3;
    }
    &__description {
      @include body-MD;
    }
  }
}
@media screen and (max-width: 1440px) and (min-width: 768.02px) {
  .block{
    width: 768px;
    margin: 150px 0;
  }
  .block-text{
    &__title {
      @include text-H2;
    }
    &__description {
      @include body-LG;
    }
  }
}
@media screen and (min-width: 1440.02px) {
  .block{
    max-width: 1200px;
    margin: 150px 0;
  }
  .block-text{
    &__title {
      @include text-H2;
    }
    &__description {
      @include body-LG;
    }
  }
}
</style>
