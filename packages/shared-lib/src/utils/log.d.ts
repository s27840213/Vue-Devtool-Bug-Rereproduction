export {}

// Extend Window type, https://bobbyhadz.com/blog/typescript-extend-window
declare global {
  interface Window {
    webkit?: {
      messageHandlers: {
        [key: string]: {
          postMessage: (message: any) => void
        }
      }
    }
    consoleLog: () => void
    consoleLogBuffer: () => void
  }
}
