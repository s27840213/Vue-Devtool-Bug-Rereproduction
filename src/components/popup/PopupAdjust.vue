<template lang="pug">
  div(class="popup-adjust p-10")
    div(class="popup-adjust__field"
      v-for="field in fields"
      :key="field.name")
      div(class="popup-adjust__label")
        div {{ field.label }}
        input(class="popup-adjust__range-input"
          :value="currLayerAdjust[field.name] || 0"
          :max="field.max"
          :min="field.min"
          :name="field.name"
          @input="handleField"
          type="range")
      input(class="popup-adjust__text body-2 text-gray-2 ml-10"
        type="text"
        :name="field.name"
        @input="handleField"
        :value="currLayerAdjust[field.name] || 0")
</template>

<script lang="ts">
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import ImageAdjustUtil from '@/utils/imageAdjustUtil'

export default Vue.extend({
  data () {
    return {
      fields: [
        {
          name: 'brightness',
          label: '亮度',
          max: 100,
          min: -100
        },
        {
          name: 'contrast',
          label: '對比度',
          max: 100,
          min: -100
        },
        {
          name: 'saturate',
          label: '飽和度',
          max: 100,
          min: -100
        },
        {
          name: 'hue',
          label: '色調',
          max: 100,
          min: -100
        },
        {
          name: 'blur',
          label: '模糊化',
          max: 100,
          min: -100
        },
        {
          name: 'halation',
          label: '暈影',
          max: 100,
          min: 0
        },
        {
          name: 'warm',
          label: '溫暖',
          max: 100,
          min: -100
        }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'getCurrSelectedLayers',
      'getCurrSelectedPageIndex',
      'getCurrSelectedIndex'
    ]),
    currLayer (): any {
      const layers = this.getCurrSelectedLayers as Array<IShape | IText | IImage | IGroup | ITmp>
      const imageLayers = layers.flatMap(layer => {
        if (layer.type === 'image') {
          return layer
        }
        if (layer.type === 'group') {
          return (layer.layers as IImage[]).find(l => l.type === 'image')
        }
        return null
      })
      return imageLayers.find(l => !!l)
    },
    currLayerAdjust (): any {
      return this.currLayer.styles.adjust || {}
    }
  },
  methods: {
    handleField (e: Event) {
      const { value, name } = e.target as HTMLInputElement
      const adjust = this.currLayerAdjust
      const fieldVal = Number.isNaN(+value) ? 0 : +value
      adjust[name] = fieldVal
      ImageAdjustUtil.setAdjust({
        adjust: { ...adjust },
        pageIndex: this.getCurrSelectedPageIndex,
        layerIndex: this.getCurrSelectedIndex
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-adjust {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 5px;
  box-sizing: border-box;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
  &__field {
    display: flex;
    flex-wrap: nowrap;
  }
  &__label {
    flex: 1;
    text-align: left;
    color: setColor(gray-2);
  }
  &__text {
    text-align: center;
    border: 1px solid setColor(gray-4);
    color: setColor(gray-2);
    border-radius: 0.25rem;
    width: 30px;
    height: 25px;
    align-self: flex-end;
  }

  &__range-input {
    display: block;
    appearance: none;
    outline: none;
    background: none;
    width: 100%;
    height: 20px;
    margin: 0;
    &::-webkit-slider-runnable-track {
      height: 2px;
      background-color: #d9dbe1;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 2px solid #3c64b1;
      transition: 0.2s;
      margin-top: -6.5px;
      position: relative;
    }
  }
}
</style>
