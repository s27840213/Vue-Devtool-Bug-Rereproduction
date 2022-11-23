<template lang="pug">
div(class="sidebar")
  div(class="nav")
    div(class="nav-container")
      div(class="nav-container__profile")
        avatar(class="mr-10"
          :textSize="14"
          :avatarSize="35")
        div(class="profile-text body-4")
          div {{showUname}}
          div(class="text-gray-3") {{showAccount}}
      template(v-for="view in settingsItems")
        hr(v-if="view.name === 'hr'")
        div(v-else class="nav-container__option"
            :class="{'selected': subPath === view.name}")
          router-link(:to="`/settings/${view.name}`"
            class="nav-container__option__link")
            svg-icon(:iconName="view.icon"
              :iconWidth="'15px'"
              :iconColor="'gray-2'")
            span {{view.label}}
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { mapState, mapGetters } from 'vuex'
import Avatar from '@/components/Avatar.vue'
import paymentData from '@/utils/constantData'

export default defineComponent({
  props: {
    current: {
      type: String,
      required: true
    }
  },
  components: {
    Avatar
  },
  data() {
    return {
      optionSelected: '',
      settingsItems: paymentData.settingsItems()
    }
  },
  created() {
    this.optionSelected = this.current || 'account'
  },
  computed: {
    ...mapState('user', [
      'shortName', 'uname']),
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
      if (this.account.length > 20) {
        return this.account.substring(0, 20).concat('...')
      } else {
        return this.account
      }
    },
    subPath(): string {
      return this.$route.path.split('/settings/')[1] || 'account'
    }
  }
})
</script>

<style lang="scss" scoped>
.sidebar {
  @include size(200px, 100%);
  background-color: setColor(gray-6);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  z-index: setZindex(sidebar);
}
.nav {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: scroll;
  @include no-scrollbar;
}
.nav-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: fit-content;
  min-width: 100%;
  padding-top: 30px;
  >hr {
    width: 90%;
    margin-right: 0;
    border: 0.5px solid setColor(gray-4);
  }
  &__profile {
    display: flex;
    padding-left: 10px;
    padding-bottom: 30px;
    .profile-img {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 30px;
      height: 30px;
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
  &__option {
    display: flex;
    align-items: center;
    width: calc(100% - 3px);
    font-size: 14px;
    line-height: 22px;
    font-weight: 400;
    cursor: pointer;
    margin: 10px 0;
    &:hover {
      color: setColor(blue-1);
      svg {
        color: setColor(blue-1);
      }
    }
    svg {
      padding: 0 10px 0 20px;
    }
    &__link {
      width: 100%;
      display: flex;
      align-items: center;
      color: unset;
      text-decoration: unset;
    }
  }
  .selected {
    border-right: 3px solid setColor(blue-1);
  }
}
.nav-item {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 15px 0px;
  box-sizing: border-box;
  transition: background-color 0.2s;
  &__text {
    transition: color 0.2s;
  }
}
.nav-setting {
  border-top: 1px solid #494e67;
  padding: 30px;
}
</style>
