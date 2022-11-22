<template lang="pug">
  div(class="avatar" :style="avatarStyle()")
    span(v-if="!hasAvatar"
      class="avatar__shortname text-white") {{shortName}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  props: {
    textSize: {
      type: Number,
      default: 16
    },
    avatarSize: {
      type: Number,
      default: 30
    },
    fitWidth: {
      type: Boolean,
      default: false
    },
    fitHeight: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentValue: NaN
    }
  },
  computed: {
    ...mapState('user', [
      'shortName', 'uname']),
    ...mapGetters({
      avatar: 'user/getAvatar',
      hasAvatar: 'user/hasAvatar'
    })
  },
  methods: {
    avatarStyle() {
      return {
        ...(this.avatar.prev_2x && { backgroundImage: `url(${this.avatar.prev_2x})` }),
        fontSize: `${this.textSize}px`,
        width: this.fitWidth ? '100%' : `${this.avatarSize}px`,
        height: this.fitHeight ? '100%' : `${this.avatarSize}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #61aac2;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  box-sizing: border-box;
  aspect-ratio: 1/1;
  &__shortname {
    font-weight: 700;
  }
}
</style>
