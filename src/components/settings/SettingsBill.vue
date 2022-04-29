<template lang="pug">
  div(class="bill")
    div(class="bill__title") {{$t('TMP0096')}}
    div(class="bill-table")
      span {{$t('TMP0097')}}
      span {{$t('TMP0098')}}
      span {{$t('TMP0099')}}
      span {{$t('TMP0100')}}
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'

export default Vue.extend({
  name: 'SettingsBill',
  components: {
  },
  props: {
  },
  data() {
    return {
    }
  },
  computed: {
  },
  // mounted() {
  // },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.bill {
  @include body-SM;
  padding: 60px 13% 20px 13%;
  &__title {
    @include body-MD;
    color: setColor(blue-1);
  }
  &-table {
    display: grid;
    grid-template-columns: 5fr 5fr 5fr 3fr;
  }
}
</style>
