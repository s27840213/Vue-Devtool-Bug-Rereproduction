import axios from '@/apis'
import authToken from './auth-token'

export interface IPutTextEffectResponse {
  flag: number
  msg?: string
}

class TextEffectApi {
  addTextFill (key_id: string, param: Record<string, unknown>) {
    const paramStr = JSON.stringify(param)
    return axios.request<IPutTextEffectResponse>({
      url: '/put-text-effect',
      method: 'POST',
      data: {
        token: authToken().token,
        key_id,
        param: paramStr,
        update: 0,
      }
    })
  }

  updateTextFill (key_id: string, param: Record<string, unknown>) {
    const paramStr = JSON.stringify(param)
    return axios.request<IPutTextEffectResponse>({
      url: '/put-text-effect',
      method: 'POST',
      data: {
        token: authToken().token,
        key_id,
        param: paramStr,
        update: 1,
      }
    })
  }
}

export default new TextEffectApi()
