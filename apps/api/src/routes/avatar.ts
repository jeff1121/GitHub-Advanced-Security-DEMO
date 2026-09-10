import { Router, Request, Response } from 'express';
import { saveBlob, getBlobPath } from '../services/storage';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const avatarRouter = Router();

// POST /api/avatar
avatarRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  // Use raw buffer or JSON body
  const body = req.body;
  if (!body || !body.data) {
    // Generate a default SVG avatar if no data provided
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#3b82f6"/>
      <text x="50%" y="55%" text-anchor="middle" fill="#fff" font-size="36" font-family="sans-serif">${req.user?.nickname?.[0] || 'B'}</text>
    </svg>`;
    const { filename, url } = await saveBlob(Buffer.from(svg), 'avatar.svg', 'image/svg+xml');
    return res.status(201).json({ filename, url });
  }

  try {
    const buffer = Buffer.from(body.data, 'base64');
    const { filename, url } = await saveBlob(buffer, body.name || 'avatar.png', 'image/png');
    return res.status(201).json({ filename, url });
  } catch (err: any) {
    return res.status(500).json({ error: { message: 'Failed to upload avatar' } });
  }
});

// GET /api/avatar/:file
// Phase 2: Safe path traversal check
// (Phase 3 BE-03 will remove this safe check for demonstration)
avatarRouter.get('/:file', (req: Request, res: Response) => {
  const file = req.params.file;
  const safePath = getBlobPath(file);

  if (!safePath) {
    return res.status(404).json({ error: { message: 'Avatar not found or invalid path' } });
  }

  return res.sendFile(safePath);
});
