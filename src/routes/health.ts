import { Request, Response } from 'express';

/**
 * GET /health endpoint
 */
export function healthRoute(_req: Request, res: Response): void {
  res.status(200).json({ status: 'ok' });
}

