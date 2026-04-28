export class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: unknown;
  clientVersion: string;

  constructor(message: string, options: { code: string; clientVersion: string; meta?: unknown }) {
    super(message);
    this.code = options.code;
    this.clientVersion = options.clientVersion;
    this.meta = options.meta;
  }
}
