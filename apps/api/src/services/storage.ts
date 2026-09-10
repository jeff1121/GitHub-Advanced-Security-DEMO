import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';

const LOCAL_BLOB_DIR = path.resolve(process.cwd(), '.data/blobs');

// Ensure storage directory exists
if (!fs.existsSync(LOCAL_BLOB_DIR)) {
  fs.mkdirSync(LOCAL_BLOB_DIR, { recursive: true });
}

export const saveBlob = async (
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<{ filename: string; url: string }> => {
  // Phase 2: Safe UUID-based filename sanitization
  const ext = path.extname(originalName).toLowerCase() || '.png';
  const filename = `${crypto.randomUUID()}${ext}`;

  if (config.MOCK_AZURE) {
    const filePath = path.join(LOCAL_BLOB_DIR, filename);
    await fs.promises.writeFile(filePath, buffer);
    return {
      filename,
      url: `/api/avatar/${filename}`
    };
  }

  // Real Azure Storage placeholder when MOCK_AZURE=false
  return {
    filename,
    url: `/api/avatar/${filename}`
  };
};

export const getBlobPath = (filename: string): string | null => {
  // Phase 2: Safe path resolution with Traversal Guard
  // (In Phase 3, BE-03 will remove this safe check for demonstration)
  const safePath = path.normalize(path.join(LOCAL_BLOB_DIR, filename));

  if (!safePath.startsWith(LOCAL_BLOB_DIR)) {
    return null; // Reject path traversal attempt
  }

  if (!fs.existsSync(safePath)) {
    return null;
  }

  return safePath;
};
