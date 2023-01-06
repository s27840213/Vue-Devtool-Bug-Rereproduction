<template lang="pug">
  transition(name="panel-up")
    div(ref="main" class="full-page relative")
      template(v-if="fullPageType === 'iOS16Video'")
        div(class="full-page__close"
            @click.prevent.stop="handleClose")
          svg-icon(iconName="vivisticker_close"
                  iconColor="white"
                  iconWidth="24px")
        div(class="full-page__video")
          video(autoplay playsinline muted loop :src="videoSource" :poster="thumbnail")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      fullPageType: 'vivisticker/getFullPageType'
    }),
    videoSource(): string {
      return `https://template.vivipic.com/static/video/${this.$i18n.locale.toUpperCase()}_IOS16.mp4`
    },
    thumbnail(): string {
      return `https://template.vivipic.com/static/video/${this.$i18n.locale.toUpperCase()}_IOS16_thumb.jpg`
    }
  },
  methods: {
    ...mapMutations({
      setFullPageType: 'vivisticker/SET_fullPageType'
    }),
    handleClose() {
      this.setFullPageType('none')
    }
  }
})
</script>

<style lang="scss" scoped>
.full-page {
  @include size(100%);
  position: fixed;
  top: 0;
  left: 0;
  display: grid;
  grid-template-rows: 1fr auto;
  background: setColor(black-1);
  overflow: hidden;
  z-index: setZindex('popup');
  &__close {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 20px;
    right: 20px;
  }
  &__video {
    width: 100vw;
    overflow: hidden;
    background: transparent;
    & > video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>
