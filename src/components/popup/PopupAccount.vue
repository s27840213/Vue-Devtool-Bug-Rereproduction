<template lang="pug">
div(class="popup-account text-left"
  v-click-outside="closePopup")
  div(class="popup-account__profile")
    avatar(class="mr-10"
      :textSize="14"
      :avatarSize="35")
    div(class="profile-text text-body-2")
      div {{showUname}}
      div(class="text-gray-3 body-3") {{showAccount}}
  div(class="popup-account__hr")
  template(v-for="view in settingsItems")
    div(v-if="view.name === 'hr'" class="popup-account__hr")
    div(v-else class="popup-account__option" @click="closePopup")
      router-link(:to="`/settings/${view.name}`"
                  class="popup-account__option__link")
        svg-icon(:iconName="view.icon"
                class="pr-10"
                :iconWidth="'15px'"
                :iconColor="'gray-2'")
        span {{view.label}}
  div(class="popup-account__hr")
  div(class="popup-account__option"
    @click="onLogoutClicked()")
    svg-icon(class="pr-10"
      :iconName="'logout'"
      :iconWidth="'15px'"
      :iconColor="'gray-2'")
    span {{$tc('NN0167',2)}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import vClickOutside from 'click-outside-vue3'
import { mapState, mapGetters } from 'vuex'
import Avatar from '@/components/Avatar.vue'
import paymentData from '@/utils/constantData'

export default defineComponent({
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    Avatar
  },
  data() {
    return {
      settingsItems: paymentData.settingsItems()
    }
  },
  computed: {
    ...mapState('user', [
      'uname']),
    ...mapGetters('user', {
      account: 'getAccount'
    }),
    showUname(): string {
      if (this.uname.length > 10) {
        return this.uname.substring(0, 10).concat('...')
      } else {
        return this.uname
      }
    },
    showAccount(): string {
      if (this.account.length > 25) {
        return this.account.substring(0, 25).concat('...')
      } else {
        return this.account
      }
    }
  },
  methods: {
    onLogoutClicked() {
      localStorage.setItem('token', '')
      window.location.href = '/'
    },
    closePopup() {
      this.$emit('close')
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-account {
  padding: 25px 20px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  &__profile {
    display: flex;
    padding-bottom: 10px;
    .profile-img {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      color: white;
      font-size: 18px;
      font-weight: 700;
      background: #61aac2;
      border-radius: 50%;
    }
    .profile-text {
      display: flex;
      text-align: left;
      flex-direction: column;
      justify-content: center;
    }
  }
  &__hr {
    width: 100%;
    height: 1px;
    background: setColor(gray-4);
    margin-left: auto;
    margin-right: auto;
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 0;
  }
  &__option {
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 22px;
    font-weight: 400;
    cursor: pointer;
    margin: 6px 0;
    &:hover {
      color: setColor(blue-1);
      svg {
        color: setColor(blue-1);
      }
    }
    &__link {
      width: 100%;
      display: flex;
      align-items: center;
      color: unset;
      text-decoration: unset;
    }
  }
}
</style>
