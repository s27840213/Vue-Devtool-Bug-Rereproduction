import { IMyDesign } from '@nu/vivi-lib/interfaces/vivisticker'
import { EditorType } from './editor'

export type IMyDesignType = 'all' | EditorType

/**
 * @Note we should notice that the id in Charmix means the main design id
 * and in this main design we will have sub design, so we need to save the sub design id
 */

export interface ICmMyDesign {
  type: EditorType
  id: string
  subDesignInfo: Array<{
    id: string
    width: number
    height: number
  }>
  thumbIndex: number
  updateTime: string
  // this is thumbnail size
  width: number
  height: number
}
export interface ICmSubDesign extends IMyDesign {
  type: EditorType
  subId: string
  prompt: string
  // waterfall UI need this
  width: number
  height: number
}
