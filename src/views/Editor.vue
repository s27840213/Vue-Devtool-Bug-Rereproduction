<template lang="pug">
div(class="editor")
  desktop-editor(v-if="!useMobileEditor" @setIsLoading="setIsLoading")
  mobile-editor(v-else)
  spinner(v-if="isLoading || isSaving || isGlobalLoading" :textContent="isSaving ? $t('NN0455') : $t('NN0454')")
</template>

<script lang="ts">
import DesktopEditor from '@/components/editor/editor/DesktopEditor.vue'
import MobileEditor from '@/components/editor/editor/MobileEditor.vue'
import logUtils from '@/utils/logUtils'
import stepsUtils from '@/utils/stepsUtils'
import uploadUtils from '@/utils/uploadUtils'
import editorUtils from '@/utils/editorUtils'
import { editorRouteHandler } from '@/router/handler'

import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import generalUtils from '@/utils/generalUtils'

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
      isGlobalLoading: 'getIsGlobalLoading'
    })
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
        uploadUtils.isGettingDesign = false
        logUtils.setLog('Leave editor')
        this.isSaving = false
        next()
      })
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
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType',
      clearState: 'CLEAR_state',
      clearBgRemoveState: 'bgRemove/CLEAR_bgRemoveState'
    }),
    setIsLoading(bool: boolean) {
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
