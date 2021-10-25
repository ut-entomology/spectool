export namespace ClientIpc {
  export function sendAsync<Req, Res>(
    window: Window,
    channel: string,
    req: Req
  ): Promise<Res> {
    // Construct promise before sending so we don't miss response.
    const promise = receiveOnce<Res>(window, channel + '_reply');
    window.ipc.send(channel, req);
    return promise;
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
