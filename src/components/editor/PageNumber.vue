<template lang="pug">
div(class="page-number"
    @click="showAllPages")
  span(class="page-number__text overline-SM text-white") {{ `${currCardIndex}/${pageNum}` }}
</template>

<script lang="ts">
import editorUtils from '@/utils/editorUtils'
import pageUtils from '@/utils/pageUtils'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'
export default defineComponent({
  props: {
    pageNum: Number,
    currCardIndex: Number
  },
  computed: {
    ...mapState('mobileEditor', {
      inAllPagesMode: 'mobileAllPageMode'
    })
  },
  methods: {
    showAllPages() {
      editorUtils.setMobileAllPageMode(!this.inAllPagesMode)

      if (!this.inAllPagesMode) {
        this.$nextTick(() => {
          pageUtils.fitPage()
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.page-number {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 4px;
  left: 8px;
  padding: 4px 16.5px;
  background-color: setColor(gray-1,0.5);
  border-radius: 20px;
  width: 6ch;
}
</style>
