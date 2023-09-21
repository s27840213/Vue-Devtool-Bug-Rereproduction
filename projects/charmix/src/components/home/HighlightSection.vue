<template lang="pug">
div(class="btn btn__powerful-fill w-full box-border p-24 rounded-[20px] flex items-center justify-between")
  div(class="flex gap-10 items-start justify-between flex-col")
    div(class="typo-h4") {{ title }}
    div(class="typo-body-md") {{ description }}
    router-link(
      custom
      v-slot="{ navigate }"
      to="/editor")
      nu-btn(
        theme="primary"
				:hasIcon="btnIconName ! == undefined"
				:iconName="btnIconName"
        :full="true"
        @click="navigate") {{ btnText}}
  img(src="@/assets/img/brush.png")
</template>
<script setup lang="ts">
const { imgName } = defineProps<{
  imgName: string
  btnIconName?: string
  btnText: string
  title: string
  description: string
}>()
</script>
<style lang="scss"></style>
