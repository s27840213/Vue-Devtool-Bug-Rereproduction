<template lang="pug">
div(class="editor-header" ref="header"
    :style="headerPosStyle")
  template(v-if="!isLogin")
    i18n-t(keypath="NN0352" tag="span")
      template(#signUp)
        a(:href="`/signup?redirect=${path}`") {{$tc('NN0169',1)}}
      template(#logIn)
        a(:href="`/login?redirect=${path}`") {{$tc('NN0168',1)}}
  template(v-else)
    router-link(to="/mydesign" class="body-3 pointer hover-effect a-reset no-wrap") {{$t('NN0080')}}
    span(class="body-3 pointer") {{`${!isRoot ? '/...': ''}`}}
    router-link(v-if="parentFolder.name && parentFolder.path"
      :to="`/mydesign/${parentFolder.path}`"
      class="body-3 pointer hover-effect a-reset") {{`/${parentFolder.name}`}}
    span(class="body-3 ml-10 mr-5") /
    input(class="body-3 text-gray-2" type="text"
      :placeholder="`${$t('NN0079')}`"
      maxlength="64"
      :value="pagesName"
      @change="setPagesName"
      ref="pagesName")
    svg-icon(:iconName="'upload-cloud'"
      :iconWidth="'20px'"
      :iconColor="statusColor"
      class="upload-cloud ml-10"
      v-hint="statusHint"
      )
</template>

<script lang="ts">
import store from '@/store'
import networkUtils from '@/utils/networkUtils'
import pageUtils from '@/utils/pageUtils'
import rulerUtils from '@/utils/rulerUtils'
import uploadUtils from '@/utils/uploadUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  data() {
    return {
      designUploadStatus: 'success'
    }
  },
  created() {
    uploadUtils.onDesignUploadStatus((status) => {
      this.designUploadStatus = status
    })
  },
  beforeUnmount() {
    uploadUtils.offDesignUploadStatus()
  },
  computed: {
    ...mapGetters({
      groupId: 'getGroupId',
      folderInfo: 'getFolderInfo'
    }),
    isLogin(): boolean {
      return store.getters['user/isLogin']
    },
    path(): string {
      return this.$route.path
    },
    isRoot(): boolean {
      return this.$route.query.path ? (this.$route.query.path as string).split(',').length === 1 : this.folderInfo.isRoot
    },
    pagesName(): string {
      return pageUtils.pagesName
    },
    parentFolder(): {name: string, path: string} {
      const name = this.$route.query.folderName || this.folderInfo.parentFolder
      const path = this.$route.query.path || this.folderInfo.path
      return { name, path: path.split(',').join('&') }
    },
    headerPosStyle() {
      const top = rulerUtils.showRuler ? `${rulerUtils.RULER_SIZE}px` : '0px'
      return {
        top
      }
    },
    statusColor(): string {
      if (!networkUtils.check()) {
        return 'red'
      }
      return this.designUploadStatus === 'uploading' ? 'yellow' : 'green-1'
    },
    statusHint(): string {
      if (!networkUtils.check()) {
        return `${this.$t('NN0349')}`
      }
      return this.designUploadStatus === 'uploading' ? `${this.$t('NN0136')}` : `${this.$t('NN0135')}`
    }
  },
  methods: {
    setPagesName(event: Event) {
      const { value } = event.target as HTMLInputElement
      pageUtils.setPagesName(value)
    },
  }
})
</script>

<style lang="scss" scoped>
.editor-header {
  width: fit-content;
  padding: 5px 10px;
  border-radius: 0 0 0.25rem 0.25rem;
  display: flex;
  background-color: setColor(white);
  box-sizing: border-box;
  position: sticky;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  box-shadow: 0px 2px 10px setColor(gray-2, 0.1);
  pointer-events: auto;
  > span {
    height: 100%;
    transition: color 0.3s;
  }
  > input {
    width: auto;
    text-overflow: ellipsis;
    box-sizing: border-box;
    border: 2px solid transparent;
    padding: 2px;
    transition: all 0.3s;
    background-color: transparent;
    &::placeholder {
      transition: color 0.3s;
    }
    &:hover,
    &:focus {
      border: 2px solid setColor(blue-1, 0.5);
      box-sizing: border-box;
      border-radius: 5px;
      &::placeholder {
        color: setColor(blue-1, 0.5);
      }
    }
  }
}

.hover-effect {
  &:hover {
    color: setColor(blue-1);
  }
}

.a-reset {
  color: unset;
  text-decoration: unset;
}
</style>
