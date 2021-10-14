<template lang="pug">
  div(class="page-preview-page")
    div(v-if="pagename === 'last'" class="page-preview-page-last")
        btn(@click.native="addPage()" :type="'icon-mid-body'")
        svg-icon(class="pb-5"
            :iconColor="'gray-3'"
            :iconName="'plus-origin'"
            :iconWidth="'50px'")
    div(v-else class="page-preview-page-content")
        div(class="page-preview-page-content-more")
                svg-icon(class="pointer pb-5"
                :iconName="'more_horizontal'"
                :iconWidth="'25px'")
    div(v-if="pagename !== 'last'" class="page-preview-page-title")
        span {{pagename}}
</template>
<script lang="ts">
import Vue from 'vue'
import { mapMutations } from 'vuex'

export default Vue.extend({
  props: {
    pagename: String
  },
  methods: {
    ...mapMutations({
      _addPage: 'ADD_page',
      _deletePage: 'DELETE_page'
    }),
    addPage() {
      this._addPage({
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        backgroundImage: {
          config: {
            type: 'image',
            src: 'none',
            clipPath: '',
            active: false,
            shown: false,
            locked: false,
            moved: false,
            imgControl: false,
            isClipper: false,
            dragging: false,
            designId: '',
            styles: {
              x: 0,
              y: 0,
              scale: 1,
              scaleX: 0,
              scaleY: 0,
              rotate: 0,
              width: 0,
              height: 0,
              initWidth: 0,
              initHeight: 0,
              imgX: 0,
              imgY: 0,
              imgWidth: 0,
              imgHeight: 0,
              zindex: -1,
              opacity: 100
            }
          },
          posX: -1,
          posY: -1
        },
        name: 'Default Page',
        layers: [
        ],
        documentColor: [],
        designId: ''
      })
    }
  }
})
</script>
<style lang="scss" scoped>
.page-preview-page {
    display: flex;
    flex-direction: column;
    width: 150px;
    height: 180px;
    transition: 0.25s ease-in-out;

    &-content {
        position: relative;
        width: 100%;
        height: 150px;
        background: rgb(242, 255, 228);
        border-radius: 5px;
        &-more {
            position: absolute;
            right: 8px;
            top: 5px;
            opacity: 0;
        }

            &:hover > &-more {
                opacity: 1;
            }
    }
    &-title {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 30px;
        font-size: 16px;
    }
    &-last {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 150px;
        background: setColor(gray-4);

        > button {
            position: absolute;
            width: 150px;
            height: 150px;
        }
    }
}
</style>
