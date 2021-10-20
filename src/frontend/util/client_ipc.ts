
export namespace ClientIpc {
  export function sendAsync(
    window: Window,
    channel: string,
    data: any,
    onSuccess: (data: any) => void,
    onError: (err: Error) => void,
  ): void {
    receiveOnce(window, channel, onSuccess, onError)
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
    onSuccess: (data: any) => void,
    onError: (err: Error) => void
  ) {
    window.ipc.receiveOnce(channel + "-reply", (data: any) => {
      if (data instanceof Error)
        onError(data)
      else
        onSuccess(data)
    })
  }
}
