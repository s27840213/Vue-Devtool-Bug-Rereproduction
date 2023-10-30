/* eslint-disable camelcase */
import errorHandle from '@/apis/errorHandle'

class ErrorHandle {
  addMissingDesign(type: 'svg' | 'background' | 'asset-image' | 'asset-font' | 'font', design_id: string) {
    errorHandle.addMissingDesign({
      token: '',
      type,
      design_id
    })
  }
}

export default new ErrorHandle()
