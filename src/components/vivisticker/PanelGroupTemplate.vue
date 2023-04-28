<template lang="pug">
div(class="panel-group-template py-20 px-10 flex flex-column" :style="panelStyle")
  div(class="mb-30 relative")
    svg-icon(class="panel-group-template__close pointer"
      iconName="chevron-left"
      iconColor="white"
      @click="$emit('close')")
    button(class="panel-group-template__apply lead-2"
      @click="handleApplyGroupTemplate") {{ $t('NN0392', { num: count })}}
    svg-icon(v-if="showAdminTool"
      class="panel-group-template__delete pointer"
      iconName="trash"
      iconColor="white"
      @click="handleDeleteGroupTemplate")
  div(class="panel-group-template__list" :style="listStyle")
    category-template-item(v-for="(item, idx) in contents"
      class="panel-group-template__item"
      :item="item"
      :groupItem="groupItem"
      :key="`${item.id}${idx}`")
</template>

<script lang="ts">
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import assetUtils from '@/utils/assetUtils'
import editorUtils from '@/utils/editorUtils'
import modalUtils from '@/utils/modalUtils'
import paymentUtils from '@/utils/paymentUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  components: { CategoryTemplateItem },
  props: {
    groupItem: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  computed: {
    ...mapGetters({
      token: 'user/getToken',
      showAdminTool: 'user/showAdminTool'
    }),
    count(): number {
      return this.groupItem.content_ids ? this.groupItem.content_ids.length : 0
    },
    contents(): Array<{ [key: string]: any }> {
      const { content_ids: ids } = this.groupItem
      return ids ? (ids as Array<{ [key: string]: any }>)
        .map(content => ({
          ...content,
          type: 6
        })) : []
    },
    isDetailPage(): boolean {
      return this.groupItem.group_type === 1
    },
    panelStyle(): Record<string, string> {
      return this.$isTouchDevice() ? {
        padding: '20px 15px'
      } : {}
    },
    listStyle(): Record<string, string> {
      return this.$isTouchDevice() ? {
        gridTemplateColumns: `repeat(${window.innerWidth >= 600 ? 3 : 2}, 1fr)`
      } : {}
    }
  },
  methods: {
    handleApplyGroupTemplate() {
      if (!paymentUtils.checkProGroupTemplate(this.groupItem as any, this.groupItem.content_ids[0])) return
      if (this.isDetailPage && this.$isTouchDevice()) {
        modalUtils.setModalInfo(
            `${this.$t('NN0808')}`,
            [],
            {
              msg: `${this.$t('NN0358')}`,
              class: 'btn-blue-mid',
              action: () => { return false }
            }
        )
        return
      }
      assetUtils.addGroupTemplate(this.groupItem as any)
        .then(() => {
          editorUtils.setMobileAllPageMode(true)
        })
    },
    handleDeleteGroupTemplate() {
      modalUtils.setModalInfo(
        this.isDetailPage ? '確認刪除詳情頁模板？' : '確認刪除群組模板？',
        [],
        {
          msg: '',
          action: () => {
            this.$emit('close')
            this.$store.dispatch('user/groupDesign', {
              token: this.token,
              update: 1,
              list: '',
              group_id: this.groupItem.group_id,
              ecomm: this.isDetailPage ? 1 : 0
            })
          }
        }
      )
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-group-template {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  background-color: #2c2f43;
  &__apply {
    display: block;
    color: setColor(gray-6);
    padding: 7px 25px;
    border: 1px solid setColor(gray-6);
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.15);
    margin: 0 auto;
  }
  &__list {
    @include push-scrollbar10;
    @include hover-scrollbar(dark);
    display: grid;
    grid-template-columns: 145px 145px;
    row-gap: 10px;
    column-gap: 10px;
  }
  &__close {
    position: absolute;
    left: 0;
  }
  &__delete {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>
