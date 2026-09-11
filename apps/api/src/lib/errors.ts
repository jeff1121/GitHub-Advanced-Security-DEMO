import { Request, Response, NextFunction, RequestHandler } from 'express';

export class AppError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function asyncRoute(run: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res, next) => { Promise.resolve(run(req, res)).catch(next); };
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) return res.status(error.status).json({ error: { message: error.message } });
  if (error instanceof SyntaxError) return res.status(400).json({ error: { message: 'Invalid JSON body' } });
  console.error('Request failed; private error details are not logged.');
  return res.status(503).json({ error: { message: 'Service temporarily unavailable' } });
}
