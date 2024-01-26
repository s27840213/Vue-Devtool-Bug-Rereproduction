<template lang="pug">
div(class="panel-login flex-center mx-24 my-8" v-out="close")
  div(class="flex flex-col gap-32" :class="{ invisible: waiting }")
    span(class="text-yellow-cm typo-h4") {{ $t('CM0073') }}
    img(
      class="w-full"
      :src="require('@img/png/appleLogin.png')"
      @click="login")
    i18n-t(
      keypath="CM0074"
      tag="span"
      class="body-SM text-white")
      template(#use)
        a(
          class="text-white"
          :href="termsPage"
          target="_blank") {{ $t('NN0162') }}
      template(#privacy)
        a(
          class="text-white"
          :href="privacyPage"
          target="_blank") {{ $t('NN0161') }}
  svg-icon(
    class="absolute animate-spin"
    :class="{ hidden: !waiting }"
    iconName="spinner2"
    iconWidth="24px"
    iconColor="yellow-cm")
</template>

<script lang="ts" setup>
import vuex from '@/vuex'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import { directive as vOut } from 'click-outside-vue3'

const { t } = useI18n()
const termsPage = t('CM0145')
const privacyPage = t('CM0144')
const waiting = ref(false)

const close = () => {
  if (waiting.value) return
  vuex.commit('user/setShowForceLogin', false)
}
const login = async () => {
  waiting.value = true
  const loginResult = await cmWVUtils.login('Apple', 'en')
  waiting.value = false
  if (loginResult && loginResult.flag === 0) {
    close()
  }
}
</script>

<style lang="scss" scoped></style>
