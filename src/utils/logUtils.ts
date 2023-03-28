import generalUtils from './generalUtils'
import uploadUtils from './uploadUtils'

class LogUtils {
  uploadLog() {
    if (uploadUtils.isLogin) {
      uploadUtils.uploadLog(this.getLog() ?? '')
    }
    // this.consoleLog()
    this.clearLog()
  }

  getLog() {
    return localStorage.getItem('log')
  }

  setLog(logContent: string) {
    const newContent = `${logContent} - [Log generated time: ${generalUtils.generateTimeStamp()}]`
    localStorage.setItem('log', this.getLog ? `${this.getLog()}\n${newContent}` : newContent)
  }

  setLogAndConsoleLog(...logContent: any[]) {
    console.log(...logContent)
    logContent = logContent.map(lc => typeof lc === 'string' ? lc : JSON.stringify(lc))
    this.setLog(logContent.join(' '))
  }

  clearLog() {
    if (this.getLog()) {
      localStorage.setItem('log', '')
    }
  }

  consoleLog() {
    console.log(this.getLog())
  }
}

const logUtils = new LogUtils()

export default logUtils
