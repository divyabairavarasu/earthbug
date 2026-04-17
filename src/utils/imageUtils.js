const JPEG_MIME_TYPE = 'image/jpeg';
const IMAGE_MAX_DIMENSION = 1024;
const IMAGE_COMPRESSION_QUALITY = 0.85;
const BYPASS_COMPRESSION_MIME_TYPES = new Set(['image/gif', 'image/svg+xml']);

export function getBase64FromDataUrl(dataUrl) {
  return dataUrl.split(',')[1] ?? '';
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('FileReader did not return an image data URL.'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('Could not read the selected image file.'));
    };

    reader.readAsDataURL(file);
  });
}

export function compressImage(
  dataUrl,
  maxDimension = IMAGE_MAX_DIMENSION,
  quality = IMAGE_COMPRESSION_QUALITY,
) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const longestSide = Math.max(image.width, image.height);
      const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
      const canvas = document.createElement('canvas');
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Could not create an image compression canvas.'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL(JPEG_MIME_TYPE, quality);

      resolve({
        dataUrl: compressedDataUrl,
        base64: getBase64FromDataUrl(compressedDataUrl),
        mimeType: JPEG_MIME_TYPE,
      });
    };

    image.onerror = () => {
      reject(new Error('Could not load the image for compression.'));
    };

    image.src = dataUrl;
  });
}

export async function prepareImageForAnalysis({ dataUrl, mimeType }) {
  if (BYPASS_COMPRESSION_MIME_TYPES.has(mimeType)) {
    return {
      dataUrl,
      base64: getBase64FromDataUrl(dataUrl),
      mimeType,
    };
  }

  return compressImage(dataUrl);
}
