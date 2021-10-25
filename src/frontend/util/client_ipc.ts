export namespace ClientIpc {
  export async function sendAsync(
    window: Window,
    channel: string,
    request?: any
  ): Promise<any> {
    const response = await window.ipc.invoke(channel, request);
    if (response instanceof Error) throw response;
    return response;
  }

  export function sendSync(window: Window, channel: string, request?: any): any {
    const response = window.ipc.sendSync(channel, request);
    if (response instanceof Error) throw Error;
    return response;
  }
}
