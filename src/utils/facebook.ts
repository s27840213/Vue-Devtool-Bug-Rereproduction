const API_VERSION = 'v11.0'
const APP_HOST = 'https://vivipic.com'
const CLIENT_ID = '882063489184334'

export default class Facebook {
  static getDialogOAuthUrl (state: string, redirectUri: string) : string {
    // reference: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#login
    return `https://www.facebook.com/${API_VERSION}/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${APP_HOST}${redirectUri}&state=${state}&scope=email,public_profile&response_type=code%20granted_scopes`
  }
}
