<template lang="pug">
div(class="popup-submit bg-white")
  span(class="mr-10") ID
  input(ref="input"
    type="text"
    v-model="id")
  btn(:type="'primary-sm'" class="rounded my-5"
    @click.native="upload()") 上傳
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters } from 'vuex'
import uploadUtils from '@/utils/uploadUtils'
import layerUtils from '@/utils/layerUtils'
import modalUtils from '@/utils/modalUtils'
import popupUtils from '@/utils/popupUtils'

export default defineComponent({
  data() {
    return {
      MappingUtils,
      id: ''
    }
  },
  props: {
    type: {
      type: String,
      default: ''
    }
  },
  mounted() {
    (this.$refs.input as HTMLInputElement).focus()
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    getType(): Array<string> {
      return [...this.currSelectedInfo.types]
    },
    isText(): boolean {
      return this.getType.includes('text') && this.currSelectedInfo.layers.length === 1
    },
    isTextGroup(): boolean {
      if (this.isGroup) {
        const typeSet = layerUtils.getGroupLayerTypes()
        return typeSet.has('text')
      } else {
        return false
      }
    },
    updateType(): string {
      return this.isTextGroup || this.isText ? 'text' : this.getType[0]
    }
  },
  methods: {
    upload() {
      if (this.id.length === 20) {
        uploadUtils.uploadLayer(this.type || this.updateType, this.id)
        popupUtils.closePopup()
      } else {
        modalUtils.setModalInfo('上傳錯誤', ['Design Id 長度不符合格式(20碼)'])
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-submit {
  padding: 0.375rem 0.625rem;
  display: flex;
  align-items: center;
  width: 320px;
  > input {
    border: 1px solid setColor("gray-4");
    border-radius: 5px;
    margin-right: 10px;
    text-align: center;
  }
}
</style>
