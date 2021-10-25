export namespace ClientIpc {
  export async function sendAsync<Req, Res>(
    window: Window,
    channel: string,
    request?: Req
  ): Promise<Res> {
    const response = await window.ipc.invoke(channel, request);
    if (response instanceof Error) throw response;
    return response;
  }

  export function sendSync<Req, Res>(
    window: Window,
    channel: string,
    request?: Req
  ): Res {
    const response = window.ipc.sendSync(channel, request);
    if (response instanceof Error) throw Error;
    return response as Res;
  }
}
