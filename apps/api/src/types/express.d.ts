declare module 'express' {
  interface Request {
    cookies: Record<string, string>;
  }
}
