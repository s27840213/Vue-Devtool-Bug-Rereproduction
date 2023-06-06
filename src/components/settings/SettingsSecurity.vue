<template lang="pug">
div(class="settings-security")
  div(class="settings-security__content")
    div
      div(class="settings-security__title") {{$t('NN0310')}}
      div(class="settings-security__item")
        span(v-if="showUpdatePassword") {{$t('NN0311')}} {{lastUpdateText}}
        span(v-else) {{$t('NN0177')}}
        nubtn(v-if="showUpdatePassword" theme="secondary"
            @click="onChangeClicked()")  {{$t('NN0313')}}
      div(class="settings-security__divider")
    //- div(class="settings-security__title") {{$t('NN0314')}}
    //- div(class="settings-security__item")
    //-   span {{$t('NN0315')}}
    //-   nubtn(theme="secondary")  {{$t('NN0316')}}
    //- div(class="settings-security__divider")
    div(v-if="!isAdmin")
      div(class="settings-security__title") {{$tc('NN0317',1)}}
      div(class="settings-security__item")
        span {{$t('NN0318')}}
        nubtn(theme="secondary" @click="deleteAccount()")  {{$tc('NN0317',2)}}
      div(class="settings-security__divider")
  spinner(v-if="isLoading")
  div(v-if="showVerifyPopup"
    class="settings-security__popup-verify popup-window")
    popup-verify(type="oldPass"
      :account="account"
      @close="closePopup()")
</template>

<script lang="ts">
import PopupVerify from '@/components/popup/PopupVerify.vue'
import popupUtils from '@/utils/popupUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    PopupVerify
  },
  data() {
    return {
      isLoading: false,
      showUpdatePassword: false,
      showVerifyPopup: false
    }
  },
  computed: {
    ...mapGetters({
      account: 'user/getAccount',
      upassUpdate: 'user/getUpassUpdate',
      isAdmin: 'user/isAdmin',
    }),
    lastUpdateText(): string {
      if (this.upassUpdate === '0000-00-00 00:00:00') {
        return this.$t('NN0325') as string
      }

      const s = new Date(this.upassUpdate)
      return this.$t('NN0312', { year: s.getFullYear(), month: s.getMonth() + 1, date: s.getDate() }) as string
    },
  },
  mounted() {
    this.showUpdatePassword = this.upassUpdate.length > 0
  },
  methods: {
    deleteAccount() {
      popupUtils.openPopup('delete-account')
    },
    onChangeClicked() {
      this.showVerifyPopup = true
    },
    closePopup() {
      this.showVerifyPopup = false
    },
  }
})
</script>

<style lang="scss" scoped>
.settings-security {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  &__content {
    width: 70%;
    padding-top: 50px;
    padding-left: 30px;
    @media (max-width: 976px) {
      width: 80%;
      padding-left: 0;
    }
    @media (max-width: 541px) {
      width: 100%;
      padding-top: 0;
    }
  }
  &__title {
    text-align: left;
    font-size: 16px;
    color: setColor(blue-1);
  }
  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    font-size: 14px;
    padding: 20px 0;
    @include layout-mobile {
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      line-height: 22px;
    }
  }
  &__divider {
    width: 100%;
    border-top: 2px solid setColor(gray-4);
    margin-top: 15px;
    padding-bottom: 25px;
  }
  &__popup-verify {
  }
}
</style>
