<template lang="pug">
div(class="p-giphy" v-click-outside="vcoConfig")
  div(class="p-giphy__actions")
    div(class="p-giphy__action" @pointerdown="toggleFavoritesItem()")
      svg-icon(:iconName="content.iconName" iconWidth="18px" iconColor="white")
      span(class="p-giphy__action--desc") {{content.desc}}
    div(class="p-giphy__action" @pointerdown="download()")
      svg-icon(iconName="download_flat" iconWidth="18px" iconColor="white")
      span(class="p-giphy__action--desc") {{$t('NN0889')}}
  div(class="p-giphy__hr")
  div(class="p-giphy__tips")
    span(class="p-giphy__tips--title") {{$t('NN0763')}}
    span {{` : ${$t('NN0764')}`}}
  img(class="p-giphy__logo" :src="giphyLogo")
</template>

<script lang="ts">
import { IGif } from '@/interfaces/giphy'
import giphyLogo from '@img/png/giphy-logo.png'
import i18n from '@nu/vivi-lib/i18n'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'

export default defineComponent({
  name: 'PanelGiphyMore',
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      vcoConfig: {
        handler: () => { editorUtils.setShowMobilePanel(false) },
        events: ['contextmenu', 'touchstart', 'pointerdown']
      },
      giphyLogo
    }
  },
  computed: {
    ...mapState('giphy', {
      selectedGif: 'selectedGif'
    }),
    ...mapGetters('giphy', {
      checkItemFavorites: 'checkItemFavorites'
    }),
    content(): Record<string, string> {
      return this.checkItemFavorites((this.selectedGif as IGif).id) ? {
        iconName: 'favorites-fill',
        desc: i18n.global.tc('NN0207')
      } : {
        iconName: 'heart',
        desc: i18n.global.tc('NN0205')
      }
    }
  },
  methods: {
    ...mapActions('giphy', {
      toggleFavorite: 'toggleFavorite'
    }),
    toggleFavoritesItem() {
      this.toggleFavorite({ items: this.selectedGif })
    },
    download() {
      stkWVUtils.saveToIOS(this.selectedGif.src, 'gif')
    }
  }
})
</script>

<style lang="scss" scoped>
.p-giphy {
  &__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  &__action {
    display: flex;
    align-items: center;
    padding: 8px 26px;
    color: setColor(white);
    &--desc {
      padding-left: 12px;
    }
    &:active {
      background: setColor(black-3-5);
    }
  }
  &__hr {
    border: 0.5px solid setColor(black-3-5);
    margin: 10px 24px;
  }
  &__tips {
    @include body-SM;
    text-align: left;
    padding: 0 24px;
    color: setColor(black-5);
    &--title {
      font-weight: 600;
    }
  }
  &__logo {
    padding: 10px 24px;
    height: 22px;
  }
}
</style>
