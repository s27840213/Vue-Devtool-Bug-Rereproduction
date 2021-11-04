<template lang="pug">
  section
    div(:class="[`nav-folder-${level}`, {'bg-gray-5': folder.isCurrLocation}]"
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
    structure-folder(v-for="subFolder in checkExpand(folder.subFolders)" :folder="subFolder" :level="level+1" :parents="[...parents, folder.id]"
                    @moveToFolderSelect="handleMoveToFolderSelect"
                    @moveToFolderExpand="handleMoveToFolderExpand")
</template>
<script lang="ts">
import Vue from 'vue'
import { IFolder, IPathedFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'

export default Vue.extend({
  name: 'structure-folder',
  components: {
  },
  props: {
    folder: Object,
    parents: Array,
    level: Number
  },
  methods: {
    expandIconStyles() {
      return this.folder.isExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    handleSelection() {
      this.$emit('moveToFolderSelect', `${designUtils.appendPath(this.parents as string[], this.folder as IFolder).join('/')}`)
    },
    handleMoveToFolderSelect(data: string) {
      this.$emit('moveToFolderSelect', data)
    },
    handleMoveToFolderExpand(data: IPathedFolder) {
      this.$emit('moveToFolderExpand', data)
    },
    toggleExpansion() {
      this.$emit('moveToFolderExpand', { parents: this.parents, folder: this.folder })
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
      > span {
        font-family: 'NotoSansTC';
        text-align: left;
        color: setColor(gray-2);
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0.03em;
        display: block;
        white-space: nowrap;
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
