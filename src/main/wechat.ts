import { BrowserWindow, screen } from 'electron'
import { ipcOnWithLog } from './api/ipc'

let popupWindows: BrowserWindow[] = []

export function setupWechatIPC() {
  ipcOnWithLog('wechat:show-popup', (_, config, message) => {
    if (!config || !config.enabled) return

    const { width, height, duration } = config
    const { workArea } = screen.getPrimaryDisplay()

    // 计算屏幕右上角位置，支持多个弹窗向下堆叠
    const x = Math.round(workArea.x + workArea.width - width - 20)
    const yOffset = popupWindows.length * (parseInt(height) + 15)
    const y = Math.round(workArea.y + 20 + yOffset)

    let popup = new BrowserWindow({
      width: parseInt(width),
      height: parseInt(height),
      x: x,
      y: y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      hasShadow: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // 安全处理消息，防止 XSS
    const safeMessage = (message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        #container {
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 15px 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          background-color: ${config.bgColor};
          color: ${config.textColor};
          border-radius: ${config.borderRadius}px;
          opacity: ${config.opacity};
        }

        .icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #07c160;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .icon-wrap svg {
          width: 32px;
          height: 32px;
          fill: white;
        }

        .content-wrap {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
          opacity: 0.9;
        }

        .message {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div id="container">
        <div class="icon-wrap">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 14C8.5 14 7 16 6 16C7.5 16 8.5 15.5 8.5 15.5C8.5 15.5 9 15.6 9.5 15.6C12.5 15.6 15 13.4 15 10.5C15 7.6 12.5 5.4 9.5 5.4C6.5 5.4 4 7.6 4 10.5C4 11.8 4.6 13 5.6 13.8L4.8 15.2L6 14.5C6.7 14.8 7.6 15 8.5 15C8.5 15 8.5 14 8.5 14ZM18.5 17.5C18.5 17.5 19.5 18 21 18C20 18 18.5 16 18.5 16C18.5 16 17.8 16.2 17 16.2C13.7 16.2 11 13.8 11 10.8C11 10.5 11.1 10.2 11.2 9.9C11.2 9.9 11 10 11 10.2C11 13.4 13.9 16 17 16C17.5 16 18 15.9 18.5 15.9C18.5 15.9 18.5 17.5 18.5 17.5ZM7.5 9C7.2 9 7 8.8 7 8.5C7 8.2 7.2 8 7.5 8C7.8 8 8 8.2 8 8.5C8 8.8 7.8 9 7.5 9ZM11.5 9C11.2 9 11 8.8 11 8.5C11 8.2 11.2 8 11.5 8C11.8 8 12 8.2 12 8.5C12 8.8 11.8 9 11.5 9ZM15 12C14.7 12 14.5 11.8 14.5 11.5C14.5 11.2 14.7 11 15 11C15.3 11 15.5 11.2 15.5 11.5C15.5 11.8 15.3 12 15 12ZM19 12C18.7 12 18.5 11.8 18.5 11.5C18.5 11.2 18.7 11 19 11C19.3 11 19.5 11.2 19.5 11.5C19.5 11.8 19.3 12 19 12Z"/>
          </svg>
        </div>
        <div class="content-wrap">
          <div class="title">微信</div>
          <div class="message">${safeMessage}</div>
        </div>
      </div>
    </body>
    </html>
    `

    popup.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    popupWindows.push(popup)

    // 定时自动关闭
    setTimeout(() => {
      if (popup && !popup.isDestroyed()) {
        popup.close()
        // 从数组中移除
        popupWindows = popupWindows.filter((p) => p !== popup)
      }
    }, parseInt(duration))
  })
}
