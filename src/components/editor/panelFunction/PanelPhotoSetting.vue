<template lang="pug">
  div(class="photo-setting")
    span(class="photo-setting__title text-blue-1 subtitle-1") 照片設定
    div(class="photo-setting__grid")
      btn(class="full-width" :type="'gray-mid'") 裁切
      btn(class="full-width" :type="'gray-mid'") 濾鏡
      btn(class="full-width" :type="'gray-mid'") 調整
      btn(class="full-width" :type="'gray-mid'") 去背
    //- property-bar
    //-   input(class="body-2 text-gray-2" max="100" min="0" step="1" v-model="opacity")
    //-   svg-icon(class="pointer"
    //-     :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
    //- action-bar(class="flex-evenly")
    //-   svg-icon(v-for="(icon,index) in mappingIcons('font')"
    //-     :key="`gp-action-icon-${index}`"
    //-     class="pointer"
    //-     :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations } from 'vuex'
import { ITmp, IText, IImage, IGroup, IShape } from '@/interfaces/layer'

export default Vue.extend({
  components: {
    SearchBar
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer',
      currSubSelectedInfo: 'getCurrSubSelectedInfo'
    }),
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    opacity: {
      get(): string | number {
        if (!this.isGroup) {
          return this.currSelectedInfo.layers.length === 1 ? this.getLayer(this.currSelectedInfo.pageIndex, this.currSelectedIndex).styles.opacity
            : [...new Set(this.currSelectedInfo.layers.map((layer: ITmp | IShape | IText | IImage | IGroup) => {
              return layer.styles.opacity
            }))].length === 1 ? this.currSelectedInfo.layers[0].styles.opacity : 'mix'
        } else {
          const groupLayer = this.currSelectedInfo.layers[0]
          if (this.hasSubSelectedLayer) {
            return groupLayer.layers[this.currSubSelectedInfo.index].styles.opacity
          } else {
            return [...new Set(groupLayer.layers.map((layer: ITmp | IShape | IText | IImage | IGroup) => {
              return layer.styles.opacity
            }))].length === 1 ? groupLayer.layers[0].styles.opacity : 'mix'
          }
        }
      },
      set(value: number) {
        if (value > 100) {
          value = 100
        }
        if (!this.isGroup) {
          if (this.currSelectedInfo.layers.length === 1) {
            this.$store.commit('UPDATE_layerStyles', {
              pageIndex: this.currSelectedInfo.pageIndex,
              layerIndex: this.currSelectedIndex,
              styles: {
                opacity: value
              }
            })
          } else {
            this.$store.commit('UPDATE_selectedLayersStyles', {
              styles: {
                opacity: value
              }
            })
          }
        } else {
          if (this.hasSubSelectedLayer) {
            this.$store.commit('SET_subLayerStyles', {
              pageIndex: this.currSelectedInfo.pageIndex,
              primaryLayerIndex: this.currSelectedInfo.index,
              subLayerIndex: this.currSubSelectedInfo.index,
              styles: {
                opacity: value
              }
            })
          } else {
            this.$store.commit('UPDATE_groupLayerStyles', {
              styles: {
                opacity: value
              }
            })
          }
        }
      }
    }
  },
  methods: {
    ...mapMutations({
      updateLayerStyles: 'UPDATE_layerStyles'
    }),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    }
  }
})
</script>

<style lang="scss" scoped>
.photo-setting {
  text-align: center;
  > div:nth-child(n + 1) {
    margin-top: 15px;
  }
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(2, 1fr);
    row-gap: 10px;
    column-gap: 20px;
  }
}
</style>
