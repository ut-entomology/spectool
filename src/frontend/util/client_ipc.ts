// TODO: redo using invoke()

export namespace ClientIpc {
  export async function sendAsync<Req, Res>(
    window: Window,
    channel: string,
    req: Req
  ): Promise<Res> {
    const res = await window.ipc.invoke(channel, req);
    if (res instanceof Error) throw res;
    return res;
  }

  export function sendSync<Res>(window: Window, channel: string, request: any): Res {
    const res = window.ipc.sendSync(channel, request);
    if (res instanceof Error) throw Error;
    return res as Res;
  }

  export function receiveOnce<Res>(window: Window, channel: string) {
    return new Promise<Res>((resolve, reject) => {
      window.ipc.receiveOnce(channel, (res: Res) => {
        if (res instanceof Error) reject(res);
        else resolve(res);
      });
    });
  }
}
