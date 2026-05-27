const DEFAULT_MAX_DIMENSION = 1280;
const DEFAULT_QUALITY = 0.78;
const DEFAULT_MAX_BYTES = 900_000;

function isImageDataUrl(value: string) {
  return /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });
}

async function canvasToDataUrl(
  image: HTMLImageElement,
  maxDimension: number,
  quality: number
) {
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context unavailable');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function compressImageDataUrl(
  value: string,
  options?: {
    maxDimension?: number;
    quality?: number;
    maxBytes?: number;
  }
) {
  if (!value || !isImageDataUrl(value)) {
    return value;
  }

  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  let quality = options?.quality ?? DEFAULT_QUALITY;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;

  try {
    const image = await loadImage(value);
    let compressed = await canvasToDataUrl(image, maxDimension, quality);

    while (compressed.length > maxBytes && quality > 0.45) {
      quality -= 0.12;
      compressed = await canvasToDataUrl(image, maxDimension, quality);
    }

    return compressed;
  } catch (error) {
    console.error('Image compression failed:', error);
    return value;
  }
}
