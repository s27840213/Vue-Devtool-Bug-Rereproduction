<template lang="pug">
  div(class="nu-image"
      :style="styles()"
      draggable="false")
    img(class="nu-image__picture" :src="src")
</template>

<script lang="ts">
import ImageUtils from '@/utils/imageUtils'
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object
  },
  mounted() {
    console.log(this.config)
  },
  computed: {
    src(): string {
      if (this.config.src) {
        return this.config.src
      } else {
        return ImageUtils.getSrc(this.config)
      }
    }
  },
  methods: {
    styles() {
      const { styles } = this.config
      return {
        transform: `translate(${styles.imgX}px, ${styles.imgY}px)`,
        width: `${styles.imgWidth}px`,
        height: `${styles.imgHeight}px`
      }
    }
  }
})
// type: image
// src: '',  //先看這個，如果是空字串，再讀src_obj
// src_obj: {
// asset_id: xxx
// user_id: yyy
// type: public/private/3rd/url
// },

// public: https://template.vivipic.com/${user_id}/${asset_id}/...
// private: https://d28vpyd7xcfiwl.https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyMzg3MDN8MHwxfHNlYXJjaHwyfHxTb2FwfHpoLVRXfDB8fHx8MTYzMDM4MTUyNw&ixlib=rb-1.2.1&q=80&w=1080https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyMzg3MDN8MHwxfHNlYXJjaHwyfHxTb2FwfHpoLVRXfDB8fHx8MTYzMDM4MTUyNw&ixlib=rb-1.2.1&q=80&w=1080.net/${user_id}/asset/image/${asset_id}/full?...
// ? :
// 3rd: https://images.unsplash.com/${asset_id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyMzg3MDN8MHwxfGFsbHw0fHx8fHx8MXx8MTYzMDU1MTY5NQ&ixlib=rb-1.2.1&q=80&w=200
// url: ${asset_id} // for 彈性

// const dl_url = 'https://d28vpyd7xcfiwl.cloudfront.net/bPixkgCLr2xsYLp1IaEH/*?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9kMjh2cHlkN3hjZml3bC5jbG91ZGZyb250Lm5ldC9iUGl4a2dDTHIyeHNZTHAxSWFFSC8qIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNjI4ODMxMDM2MjQwfX19XX0_&Key-Pair-Id=KEUNR6VVD9BE6&Signature=YsrlO28eY6thCyBrVpuUSa~vzzeOIuGQjYlMrxGkRZXrT8aHwxYUQcHZ43UOCjnP6TsSjyS6m892LD4MmVIXKLXycQwyfLM-65b2d6s9Z9HJRdXbWW7GXVqrhByXTKdWBkNnGlxmJRQ2tHSLrA1iGQbCv~ko4~e7DRSDXTcB9ssU3BOAO0BnHdrz45ghuRotHtIXTPgSZQIv0pYqbGplGr-vUO0~XNRIDfW07C1AUvXEJPHfXg0JmADPmpYR-hetz2tFTDnla0wSaWmpdG0IdgE4phcrG33~xkzKxNCoB6Bozf6s5K~nDJpnjYWtz5gC5sHrsbBLGLUqk1BAR9jljQ__'
// const full_url = dl_url.replace('*', `asset/image/${asset_id}/full`)
</script>

<style lang="scss" scoped>
.nu-image {
  position: absolute;
  top: 0px;
  left: 0px;
  &__picture {
    object-fit: fill;
    width: 100%;
    height: 100%;
  }
}
</style>
