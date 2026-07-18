export function getUploadStorageDir() {
  const configured = String(process.env.UPLOAD_STORAGE_DIR || '').trim();
  if (configured) {
    return configured;
  }

  return process.env.NODE_ENV === 'production' ? '/data/uploads' : 'uploads';
}
