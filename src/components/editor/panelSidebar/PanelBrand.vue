<template lang="pug">
  div(class="panel-brand text-white")
    div(class="panel-brand__title mb-15")
      span(class="text-blue-1 label-lg") Brand Kit
    div(class="text-left mb-5")
      span(class="lead-2 text-left") LOGO
    btn(class="full-width" :type="'primary-mid'") Upload LOGO
    div(class="text-left  mt-10")
      span(class="lead-2 text-left") Color
    div(class="panel-brand__colors")
      div(v-for="color in colorPresets"
        class="panel-brand__color"
        :style="colorStyles(color)")
    btn(class="full-width mt-10" :type="'primary-mid'") New Color
    div(class="text-left  my-10")
      span(class="lead-2 text-left") Text Styles
    div(class="panel-brand__buttons")
      btn(class="full-width mb-10" :type="'text-heading'" ) Heading
      btn(class="full-width mb-10" :type="'text-subheading'") Subheading
      btn(class="full-width" :type="'text-body'") Body
    btn(class="full-width mt-10" :type="'primary-mid'") New Text Styles
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import SearchBar from '@/components/SearchBar.vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      colorPresets: [
        '#F2994A',
        '#F2C94C',
        '#219653',
        '#9B51E0',
        '#BB6BD9',
        '#EB5757'
      ]
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    })
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    iconAction(icon: string) {
      MappingUtils.mappingIconAction(icon)
    },
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-brand {
  @include size(100%, 100%);

  &__title {
    text-align: center;
  }
  &__colors {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }
  &__color {
    @include size(clamp(30px, 2vw, 50px), clamp(30px, 2vw, 50px));
    margin: 5px;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
  }
}
</style>
