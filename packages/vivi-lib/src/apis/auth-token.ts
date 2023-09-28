import generalUtils from "@/utils/generalUtils"

export default function authToken () {
  if (generalUtils.isStk) return { token: '' }
  const token = localStorage.getItem('token') || ''
  return token ? { token } : {}
}
