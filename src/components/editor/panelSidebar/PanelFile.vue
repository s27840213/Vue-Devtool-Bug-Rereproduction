<template lang="pug">
  div(class="panel-file")
    span(class="panel-file__title text-blue-1 label-lg") My File
    btn(class="full-width mt-20"
      :type="'primary-mid'"
      @click.native="uploadImage()") Upload Image
    div(class="tmp-gallery")
      div(v-for="")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import uploadUtils from '@/utils/uploadUtils'
import { mapActions } from 'vuex'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      assets: {
        design: [],
        font: [],
        image: [],
        video: []
      }
    }
  },
  mounted() {
    this._getAssets()
  },
  methods: {
    ...mapActions({
      getAssets: 'getAssets'
    }),
    uploadImage() {
      uploadUtils.uploadAsset()
    },
    async _getAssets() {
      const data = await this.getAssets({ token: uploadUtils.token })
      console.log(data)
      Object.assign(this.assets, data.data)
      console.log(this.assets)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-file {
  @include size(100%, 100%);
  text-align: center;
  &__title {
    margin-bottom: 30px;
  }
}
</style>
