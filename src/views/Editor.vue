<template lang="pug">
div(class="editor")
  desktop-editor(v-if="!useMobileEditor" :currPage="currPage" @setIsLoading="setIsLoading")
  mobile-editor(v-else :currPage="currPage")
  spinner(v-if="isLoading || isSaving || isGlobalLoading" :textContent="isSaving ? $t('NN0455') : $t('NN0454')")
</template>

<script lang="ts">
import DesktopEditor from '@/components/editor/editor/DesktopEditor.vue'
import MobileEditor from '@/components/editor/editor/MobileEditor.vue'
import { IPage } from '@/interfaces/page'
import editorUtils from '@/utils/editorUtils'
import logUtils from '@/utils/logUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import uploadUtils from '@/utils/uploadUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    DesktopEditor,
    MobileEditor
  },
  data() {
    return {
      isSaving: false,
      isLoading: false
    }
  },
  computed: {
    ...mapGetters({
      useMobileEditor: 'getUseMobileEditor',
      isGlobalLoading: 'getIsGlobalLoading',
      getPage: 'getPage'
    }),
    currPage(): IPage {
      return this.getPage(pageUtils.currFocusPageIndex)
    }
  },
  beforeRouteLeave(to, from, next) {
    // const answer = this.confirmLeave()
    // if (!answer) {
    //   next(false)
    //   return
    // }
    editorUtils.setCloseMobilePanelFlag(true)
    stepsUtils.clearSteps()
    if (uploadUtils.isLogin && this.$router.currentRoute.value.query.design_id && this.$router.currentRoute.value.query.type) {
      this.isSaving = true
      uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH).then(() => {
        this.setIsGettingDesign(false)
        logUtils.setLog('Leave editor')
        this.isSaving = false
        next()
      })
      this.initMobileEditorState()
    } else {
      logUtils.setLog('Leave editor')
      next()
    }
  },
  beforeUnmount() {
    /**
     * Why clear state is putting here instead of beforeRouteLeave?
     * The reason is bcz Vue 3 is too much fast than Vue 2,
     * When beforeRouteLeave triggered, the component in Editor hasn't been unmounted(destroyed) yet
     * So if we clear the state, some component watcher and computed will update and then throw lots of errors
     */
    this.clearState()
  },
  mounted() {
    const query = this.$router.currentRoute.value.query
    if (query.type === 'new-design-size') {
      query.unit = query.unit ?? 'px'
    }
    this.$router.replace({ query })
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType',
      clearState: 'CLEAR_state',
      clearBgRemoveState: 'bgRemove/CLEAR_bgRemoveState',
      setIsGettingDesign: 'SET_isGettingDesign',
      initMobileEditorState: 'mobileEditor/INIT_STATE'
    }),
    setIsLoading() {
      this.isLoading = true
    }
  }
})
</script>

<style lang="scss" scoped>
.editor {
  @include size(100%, 100%);
}
</style>
