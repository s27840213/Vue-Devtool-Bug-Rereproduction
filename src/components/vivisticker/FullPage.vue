<template lang="pug">
transition(name="panel-up")
  div(ref="main" class="full-page relative")
    template(v-if="fullPageType === 'iOS16Video'")
      div(class="full-page__video")
        video(autoplay playsinline muted loop :src="videoSource" :poster="thumbnail")
      div(v-if="showCloseButton"
          class="full-page__close"
          @click.prevent.stop="handleClose")
        svg-icon(iconName="vivisticker_close"
                iconColor="white"
                iconWidth="24px")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  data() {
    return {
      showCloseButton: false
    }
  },
  mounted() {
    this.initialize()
  },
  watch: {
    fullPageType() {
      this.$nextTick(() => {
        this.initialize()
      })
    }
  },
  computed: {
    ...mapGetters({
      fullPageType: 'vivisticker/getFullPageType',
      fullPageParams: 'vivisticker/getFullPageParams'
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
      clearFullPageConfig: 'vivisticker/UPDATE_clearFullPageConfig'
    }),
    initialize() {
      this.showCloseButton = false
      switch (this.fullPageType) {
        case 'iOS16Video':
          // eslint-disable-next-line no-case-declarations
          const fromModal = this.fullPageParams.fromModal ?? false
          if (fromModal) {
            setTimeout(() => {
              this.showCloseButton = true
            }, 5000)
          } else {
            this.showCloseButton = true
          }
      }
    },
    handleClose() {
      this.clearFullPageConfig()
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
