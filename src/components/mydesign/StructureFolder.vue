<template lang="pug">
section
  div(:class="[`nav-folder-${level}`, {'bg-gray-5': folder.isCurrLocation}]"
      :title="folder.name"
      @click="handleSelection")
    div(class="nav-folder__expand-icon-container"
        @click.stop="toggleExpansion")
      svg-icon(class="nav-folder__expand-icon"
          iconName="caret-down"
          iconColor="gray-2"
          iconWidth="7px"
          iconHeight="4px"
          :style="expandIconStyles()")
    svg-icon(iconName="folder"
        iconColor="gray-2"
        iconWidth="15px"
        style="pointer-events: none")
    div(:class="`nav-folder-${level}__text`"
        style="pointer-events: none")
        span {{ folder.name }}
  structure-folder(v-for="subFolder in checkExpand(realFolders)"
                  :folder="subFolder" :level="level+1"
                  :parents="[...parents, folder.id]")
</template>

<script lang="ts">
import { IFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'structure-folder',
  props: {
    folder: {
      type: Object,
      required: true
    },
    parents: {
      type: Array,
      required: true
    },
    level: {
      type: Number,
      required: true
    }
  },
  computed: {
    path(): string[] {
      return designUtils.appendPath(this.parents as string[], this.folder as IFolder)
    },
    realFolders(): IFolder[] {
      return designUtils.sortByCreateTime([...this.folder.subFolders])
    }
  },
  watch: {
    'folder.isExpanded': function(newVal) {
      if (newVal) {
        this.fetchCopiedStructuralFolders({ path: `${this.path.join(',')}` })
      }
    }
  },
  methods: {
    ...mapActions('design', {
      fetchCopiedStructuralFolders: 'fetchCopiedStructuralFolders'
    }),
    ...mapMutations('design', {
      setMoveToFolderSelectInfo: 'SET_moveToFolderSelectInfo',
      setCopiedExpand: 'SET_copiedExpand'
    }),
    expandIconStyles() {
      return this.folder.isExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    handleSelection() {
      this.setMoveToFolderSelectInfo(`f:${this.path.join('/')}`)
    },
    toggleExpansion() {
      this.setCopiedExpand({ path: this.path, isExpanded: !this.folder.isExpanded })
    },
    checkExpand(folders: IFolder[]): IFolder[] {
      if (this.folder.isExpanded) {
        return folders
      } else {
        return []
      }
    }
  }
})
</script>

<style lang="scss" scoped>
@function paddingForLevel($level) {
  @return 0px 10px 0px 21px * $level + 26px;
}

$maxLevels: 5;

@for $i from 0 through $maxLevels {
  .nav-folder-#{$i} {
    grid-template-columns: 15px 15px auto;
    padding: paddingForLevel($i);
    width: 100%;
    display: grid;
    grid-column-gap: 6px;
    align-items: center;
    box-sizing: border-box;
    transition: background-color 0.2s;
    height: 30px;
    cursor: pointer;
    &__text {
      height: 15px;
      display: flex;
      align-items: center;
      max-width: 180px;
      > span {
        text-align: left;
        color: setColor(gray-2);
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0.03em;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
.nav-folder__expand-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
}
.nav-folder__expand-icon {
  transition: 0.1s linear
}
</style>
