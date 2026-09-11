import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { config } from '../config';
import { AppError } from '../lib/errors';

export async function saveBlob(buffer: Buffer) {
  if (buffer.length > 1024 * 1024) throw new AppError(413, 'Image exceeds one megabyte');
  let png: Buffer;
  try {
    const image = sharp(buffer, { limitInputPixels: 4000000 });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new Error('Unsupported image');
    png = await image.resize(256, 256, { fit: 'cover' }).png().toBuffer();
  } catch { throw new AppError(400, 'Provide a valid PNG, JPEG or WebP image'); }
  await fs.mkdir(config.BLOB_DIR, { recursive: true });
  const filename = `${randomUUID()}.png`;
  await fs.writeFile(path.join(config.BLOB_DIR, filename), png, { flag: 'wx', mode: 0o600 });
  return { filename, url: `/api/avatar/${filename}` };
}

export async function getBlobPath(filename: string): Promise<string | null> {
  const basename = path.basename(filename);
  if (basename !== filename || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/.test(basename)) return null;
  try {
    const directory = await fs.realpath(config.BLOB_DIR);
    const file = await fs.realpath(path.join(directory, basename));
    if (path.dirname(file) !== directory || !(await fs.stat(file)).isFile()) return null;
    return file;
  } catch { return null; }
}
