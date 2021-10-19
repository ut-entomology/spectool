
export namespace ClientApi {
  export function sendAsync(
    window: Window,
    channel: string,
    data: any,
    callback: (err?: Error, data?: any) => void,
  ): void {
    receiveOnce(window, channel, callback)
    window.ipc.send(channel, data)
  }

  export function sendSync<T>(
    window: Window,
    channel: string,
    data: any
  ): T {
    const reply = window.ipc.sendSync(channel, data)
    if (reply instanceof Error)
      throw Error
    return reply as T
  }

  export function receiveOnce(
    window: Window,
    channel: string,
    callback: (err?: Error, data?: any) => void
  ) {
    window.ipc.receiveOnce(channel + "-reply", (data: any) => {
      if (data instanceof Error)
        callback(data, undefined)
      else
        callback(undefined, data)
    })
  }
}
