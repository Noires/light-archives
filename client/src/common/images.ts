import { ImageFormat } from '@app/shared/enums/image-format.enum';

export async function readImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const imageData = fileReader.result as string;
      const image = new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(new Error('Error loading image'));
      };

      image.src = imageData;
    };

    fileReader.onerror = () => {
      reject(fileReader.error);
    };

    fileReader.readAsDataURL(blob);
  });
}

export interface ImageConversionResult {
  filename: string;
  blob: Blob;
  hasTransparency: boolean;
}

export interface ImageCropArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

export async function convertImageElementForUpload(
  image: HTMLImageElement,
  filename: string,
  format: ImageFormat
): Promise<ImageConversionResult> {
  const g = createCanvas(image);

  return new Promise((resolve, reject) => {
    const newFilename = replaceExtension(
      filename,
      format == ImageFormat.PNG ? 'png' : 'jpg'
    );
    g.canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            blob,
            filename: newFilename,
            hasTransparency: checkTransparency(g)
          });
        } else {
          reject(new Error('Cannot convert image'));
        }
      },
      format == ImageFormat.PNG ? 'image/png' : 'image/jpeg'
    );
  });
}

export async function cropImageElementForUpload(
  image: HTMLImageElement,
  filename: string,
  format: ImageFormat,
  cropArea: ImageCropArea,
  outputWidth?: number
): Promise<ImageConversionResult> {
  const sourceWidth = Math.round(cropArea.width);
  const sourceHeight = Math.round(cropArea.height);
  const targetWidth = Math.max(1, Math.round(outputWidth || sourceWidth));
  const targetHeight = Math.max(1, Math.round((targetWidth * sourceHeight) / sourceWidth));
  const g = createCanvasWithSize(targetWidth, targetHeight);

  g.drawImage(
    image,
    Math.round(cropArea.left),
    Math.round(cropArea.top),
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    const newFilename = replaceExtension(
      filename,
      format == ImageFormat.PNG ? 'png' : 'jpg'
    );
    g.canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            blob,
            filename: newFilename,
            hasTransparency: checkTransparency(g),
          });
        } else {
          reject(new Error('Cannot crop image'));
        }
      },
      format == ImageFormat.PNG ? 'image/png' : 'image/jpeg'
    );
  });
}

export function hasTransparency(image: HTMLImageElement): boolean {
  return checkTransparency(createCanvas(image));
}

// Auxiliary functions

function createCanvas(image: HTMLImageElement): CanvasRenderingContext2D {
  const g = createCanvasWithSize(image.width, image.height);
  g.drawImage(image, 0, 0);
  return g;
}

function createCanvasWithSize(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const g = canvas.getContext('2d');

  if (!g) {
    // Cannot happen
    throw new Error('Your browser is ancient');
  }

  return g;
}

function checkTransparency(g: CanvasRenderingContext2D): boolean {
  const imageData = g.getImageData(0, 0, g.canvas.width, g.canvas.height).data;
  
  // imageData contains pixel data as bytes in RGBA order, so we check every 4th byte (alpha)
  for (let i = 3; i < imageData.length; i += 4) {
    if (imageData[i] !== 255) {
      // not an entirely opaque pixel
      return true;
    }
  }

  return false;
}

function replaceExtension(filename: string, extension: string): string {
  const lastDot = filename.lastIndexOf('.');

  if (lastDot === -1) {
    return filename + '.' + extension;
  }

  return filename.slice(0, lastDot + 1) + extension;
}
