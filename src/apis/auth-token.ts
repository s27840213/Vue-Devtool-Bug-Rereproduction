export default function authToken () {
  const token = localStorage.getItem('token') || 'eZB1CqRl52WQFAzFV3VGdfBSs8HLu9WqYHcHYnCOeU'
  return token ? { token } : {}
}
