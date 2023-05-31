import generalUtils from './generalUtils'
import uploadUtils from './uploadUtils'

class LogUtils {
  logBuffer = ''
  isUploadingLog = false

  async uploadLog() {
    const log = this.getLog()
    this.isUploadingLog = true
    try {
      await uploadUtils.uploadLog(log)
      this.clearLog() // clear log only after log is successfully uploaded
      this.setLog(this.logBuffer, false) // set content of log buffer back to localStorage
      this.logBuffer = ''
      this.isUploadingLog = false
    } catch (error) {
      console.log('Error happened while uploading log')
      this.setLogForError(error as Error)
    }
  }

  getLog(): string {
    return localStorage.getItem('log') ?? ''
  }

  setLog(logContent: string, trimLog = true) {
    if (trimLog) logContent = logContent.substring(0, 500)
    const newContent = `[${generalUtils.generateTimeStamp()}] ${logContent}`
    if (this.isUploadingLog) { // when log is uploading, append to the log buffer
      this.logBuffer = `${this.logBuffer}\n${newContent}`
      return
    }
    try {
      localStorage.setItem('log', `${this.getLog()}\n${newContent}`)
    } catch (error) {
      this.setLogForError(error as Error)
      if ((error as Error).name.includes('QuotaExceededError')) {
        // log can only be uploaded when user is logged in, otherwise, discard the log to avoid quota exceeded error.
        this.uploadLog()
        try {
          localStorage.setItem('log', `##Log uploaded because of QuotaExceededError\n${newContent}`)
        } catch (error) {
          console.log('Error happened again when setting log, discard the log')
          this.setLogForError(error as Error)
        }
      }
    }
  }

  setLogAndConsoleLog(...logContent: any[]) {
    console.log(...logContent)
    logContent = logContent.map(lc => typeof lc === 'string' ? lc : JSON.stringify(lc)).map(lc => lc.substring(0, 500))
    // slice every string to 500 characters to avoid localStorage quota exceeds
    this.setLog(logContent.join(' '), false)
  }

  setLogForError(error: Error) {
    console.error(error)
    this.setLog(`Error: ${error.name}, ${error.message}, ${error.cause}, ${error.stack}`, false)
    // don't trim the log for stack to be entirely shown
  }

  clearLog() {
    localStorage.setItem('log', '')
  }

  consoleLog() {
    console.log(this.getLog())
  }

  consoleLogBuffer() {
    console.log(this.logBuffer)
  }
}

const logUtils = new LogUtils()

window.consoleLog = logUtils.consoleLog.bind(logUtils)
window.consoleLogBuffer = logUtils.consoleLogBuffer.bind(logUtils)

export default logUtils
