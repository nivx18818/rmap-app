export class PrismaClient {
  constructor(_options?: { adapter?: unknown }) {}

  $connect = jest.fn();
  $disconnect = jest.fn();
}
