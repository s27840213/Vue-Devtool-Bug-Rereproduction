<template lang="pug">
div(class="template-no-result")
  img(class="template-no-result__img"
    :src="require('@/assets/img/svg/templates/templates-not-found.svg')")
  div(class="template-no-result__title")
  div(class="template-no-result__description")
  nubtn(theme="primary" size="mid-center")
  nubtn(theme="text" size="mid-center")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
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
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.template-no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 104px;
  &__img {
    width: 200px;
    height: 157px;
  }
  &__description {
    width: 647px;
    text-align: left;
  }
}
</style>
