<template lang="pug">
div(class="p-giphy" v-click-outside="vcoConfig")
  div(class="p-giphy__actions")
    div(class="p-giphy__action" @pointerdown="toggleFavoritesItem()")
      svg-icon(:iconName="content.iconName" iconWidth="16px" iconColor="gray-2")
      span(class="p-giphy__action--desc") {{content.desc}}
    div(class="p-giphy__action" @pointerdown="download()")
      svg-icon(iconName="download_flat" iconWidth="16px" iconColor="gray-2")
      span(class="p-giphy__action--desc") {{$t('NN0889')}}
  div(class="p-giphy__hr")
  div(class="p-giphy__tips") {{`${$t('NN0763')} : ${$t('NN0764')}`}}
  img(class="p-giphy__logo" src="@/assets/img/svg/power-by-giphy.svg")
</template>

<script lang="ts">
import i18n from '@/i18n'
import { IGif } from '@/interfaces/giphy'
import editorUtils from '@/utils/editorUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
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
      }
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
      vivistickerUtils.saveToIOS(this.selectedGif.src, 'gif')
    }
  }
})
</script>

<style lang="scss" scoped>
.p-giphy {
  padding: 0 16px 0 16px;
  &__actions {
    display: flex;
    flex-direction: column;
    padding: 10px 12px 16px 12px;
    gap: 16px;
  }
  &__action {
    display: flex;
    align-items: center;
    color: setColor(gray-2);
    &--desc {
      padding-left: 20px;
    }
  }
  &__hr {
    border: 0.5px solid setColor(gray-4);
  }
  &__tips {
    padding: 16px 8px;
    text-align: left;
    color: setColor(gray-3);
  }
  &__logo {
    padding-top: 34px;
  }
}
</style>
