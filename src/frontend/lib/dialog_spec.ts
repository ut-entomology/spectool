export class DialogSpec {
  targetName: string;
  params: Record<string, any>;

  constructor(targetName: string, params: { [key: string]: any } = {}) {
    this.targetName = targetName;
    this.params = params;
  }
}
