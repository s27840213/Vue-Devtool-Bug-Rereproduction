import generalUtils from './generalUtils'
import uploadUtils from './uploadUtils'

class LogUtils {
  async uploadLog() {
    if (!uploadUtils.isLogin) return
    const log = this.getLog()
    this.clearLog()
    try {
      await uploadUtils.uploadLog(log)
    } catch (error) {
      console.log('Error happened while uploading log')
      console.error(error)
    }
  }

  getLog(): string {
    return localStorage.getItem('log') ?? ''
  }

  setLog(logContent: string) {
    const newContent = `${logContent} - [Log generated time: ${generalUtils.generateTimeStamp()}]`
    try {
      localStorage.setItem('log', `${this.getLog()}\n${newContent}`)
    } catch (error) {
      console.error(error)
      if ((error as Error).name.includes('QuotaExceededError')) {
        // log can only be uploaded when user is logged in, otherwise, discard the log to avoid quota exceeded error.
        if (!uploadUtils.isLogin) {
          this.clearLog()
          return
        }
        this.uploadLog()
        try {
          localStorage.setItem('log', `##Log uploaded because of QuotaExceededError\n${newContent}`)
        } catch (error) {
          console.log('Error happened again when setting log, discard the log')
          console.error(error)
        }
      }
    }
  }

  setLogAndConsoleLog(...logContent: any[]) {
    console.log(...logContent)
    logContent = logContent.map(lc => typeof lc === 'string' ? lc : JSON.stringify(lc)).map(lc => lc.substring(0, 200))
    // slice every string to 200 characters to avoid localStorage quota exceeds
    this.setLog(logContent.join(' '))
  }

  clearLog() {
    localStorage.setItem('log', '')
  }

  consoleLog() {
    console.log(this.getLog())
  }
}

const logUtils = new LogUtils()

window.consoleLog = logUtils.consoleLog.bind(logUtils)

export default logUtils
