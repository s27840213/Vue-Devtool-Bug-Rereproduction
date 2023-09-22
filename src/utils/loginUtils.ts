import picWVUtils from '@/utils/picWVUtils'

class LoginUtils {
  onFacebookClicked(redirect?: string) {
    let stateStr
    if (redirect) {
      stateStr = JSON.stringify({
        redirect: redirect.replaceAll('&', '%26'),
        platform: 'fb_vivipic'
      })
    } else {
      stateStr = JSON.stringify({
        platform: 'fb_vivipic'
      })
    }
    const redirectUri = window.location.href.split('?')[0]
    window.location.href = 'https://www.facebook.com/v11.0/dialog/oauth?' +
      'scope=email,public_profile&' +
      'response_type=code%20granted_scopes&' +
      `state=${stateStr}&` +
      `redirect_uri=${redirectUri}&` +
      'client_id=882063489184334'
  }

  onGoogleClicked(redirect?: string) {
    let stateStr
    if (redirect) {
      stateStr = JSON.stringify({
        redirect: redirect.replaceAll('&', '%26'),
        platform: 'google_vivipic'
      })
    } else {
      stateStr = JSON.stringify({
        platform: 'google_vivipic'
      })
    }
    const redirectUri = window.location.href.split('?')[0]
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' +
      'scope=https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email&' +
      'include_granted_scopes=true&' +
      'response_type=code&' +
      'prompt=select_account&' +
      `state=${stateStr}&` +
      `redirect_uri=${redirectUri}&` +
      'client_id=466177459396-dsb6mbvvea942on6miaqk8lerub0domq.apps.googleusercontent.com'
  }

  logout() {
    picWVUtils.updateUserInfo({ userId: '' })
    localStorage.setItem('token', '')
    window.location.href = '/'
  }
}

export default new LoginUtils()
