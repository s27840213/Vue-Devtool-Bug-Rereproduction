<template lang="pug">
div(class="panel-login flex flex-col gap-32 mx-24 my-8" v-out="close")
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
      a(class="text-white" :href="termsPage") {{ $t('NN0162') }}
    template(#privacy)
      a(class="text-white" :href="privacyPage") {{ $t('NN0161') }}
</template>

<script lang="ts" setup>
import vuex from '@/vuex'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import { directive as vOut } from 'click-outside-vue3'

const termsPage = ''
const privacyPage = ''

const close = () => vuex.commit('user/setShowForceLogin', false)
const login = async () => {
  const loginResult = await cmWVUtils.login('Apple', 'en')
  if (loginResult && loginResult.flag === 0) {
    close()
  }
}
</script>

<style lang="scss" scoped></style>
