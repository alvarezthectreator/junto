import { promises as fs } from 'fs';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsRoot = join(__dirname, '..', '..', '..', process.env.UPLOAD_STORAGE_DIR || 'uploads');
const mediaRoot = join(uploadsRoot, 'media');

function inferExtension(mimeType = '') {
  if (mimeType.includes('png')) return '.png';
  if (mimeType.includes('webp')) return '.webp';
  if (mimeType.includes('gif')) return '.gif';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
  if (mimeType.includes('mp4')) return '.mp4';
  if (mimeType.includes('pdf')) return '.pdf';
  return '.bin';
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null;
  }

  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1] || 'application/octet-stream',
    buffer: Buffer.from(match[2], 'base64'),
  };
}

export async function ensureUploadStorage() {
  await fs.mkdir(mediaRoot, { recursive: true });
}

export async function uploadMedia(req, res) {
  try {
    const { data_url, file_name, mime_type, folder = 'media' } = req.body;

    if (!data_url) {
      return res.status(400).json({ error: 'data_url is required' });
    }

    await ensureUploadStorage();

    const parsed = parseDataUrl(data_url);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid data_url payload' });
    }

    const safeFolder = String(folder || 'media').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'media';
    const targetDir = join(uploadsRoot, safeFolder);
    await fs.mkdir(targetDir, { recursive: true });

    const extension = extname(file_name || '') || inferExtension(mime_type || parsed.mimeType);
    const fileId = `${Date.now()}-${uuidv4()}${extension}`;
    const filePath = join(targetDir, fileId);

    await fs.writeFile(filePath, parsed.buffer);

    const publicBasePath = process.env.UPLOAD_PUBLIC_PATH || '/uploads';
    const publicPath = `${publicBasePath}/${safeFolder}/${fileId}`;
    res.status(201).json({
      success: true,
      url: publicPath,
      file_name: file_name || fileId,
      mime_type: parsed.mimeType,
      size: parsed.buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}
