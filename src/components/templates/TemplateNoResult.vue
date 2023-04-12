<template lang="pug">
div(class="template-no-result")
  img(class="template-no-result__img"
    :src="require('@/assets/img/svg/templates/templates-not-found.svg')")
  div(class="template-no-result__title") {{ $t('NN0810') }}
  div(class="template-no-result__description") {{ $t('NN0811', { keyword }) }}
  nubtn(theme="primary" size="mid-center" @click="handlePrimaryBtn") {{ allHashTagAll ? templateRequestText : $t('NN0812') }}
  nubtn(v-if="!allHashTagAll" theme="text" size="mid-center" @click="handleTextBtn") {{ templateRequestText }}
</template>

<script lang="ts">
import webViewUtils from '@/utils/picWVUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TemplateNoResult',
  emits: ['updateHashTagsAll'],
  props: {
    keyword: {
      type: String,
      required: true
    },
    allHashTagAll: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    templateRequestText(): string {
      return this.$t('NN0790', { type: this.$tc('NN0001', 2) })
    }
  },
  methods: {
    handlePrimaryBtn() {
      if (this.allHashTagAll) {
        this.openUrl()
      } else {
        this.$emit('updateHashTagsAll')
      }
    },
    handleTextBtn() {
      this.openUrl()
    },
    openUrl() {
      webViewUtils.openOrGoto(this.$t('NN0791'))
    }
  }
})
</script>

<style lang="scss" scoped>
.template-no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 104px;
  gap: 20px;
  &__img {
    width: 200px;
    height: 157px;
  }
  &__title {
    @include text-H5;
    color: setColor(gray-2);
  }
  &__description {
    @include body-MD;
    color: setColor(gray-2);
    width: min(647px, 90vw);
    text-align: left;
    margin-bottom: 4px;
  }
}
</style>
