export class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: any;
  clientVersion: string;

  constructor(message: string, { code, clientVersion, meta }: any) {
    super(message);
    this.code = code;
    this.clientVersion = clientVersion;
    this.meta = meta;
  }
}
