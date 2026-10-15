import { describe, expect, it } from 'vitest';
import { imageDataUrlToBlob } from './image-data-url';

function readBlobBytes(blob: Blob): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('無法讀取圖片資料'));
        return;
      }
      resolve(Array.from(new Uint8Array(reader.result)));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

describe('imageDataUrlToBlob', () => {
  it('decodes base64 image data without making a network request', async () => {
    const blob = imageDataUrlToBlob('data:image/png;base64,iVBORw0KGgo=');

    expect(blob.type).toBe('image/png');
    expect(await readBlobBytes(blob)).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
  });

  it('decodes percent-encoded image data', async () => {
    const blob = imageDataUrlToBlob('data:image/png,%89PNG%0D%0A');

    expect(await readBlobBytes(blob)).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  });

  it('rejects malformed image data URLs', () => {
    expect(() => imageDataUrlToBlob('https://example.com/image.png')).toThrow(
      '無效的圖片 data URL',
    );
    expect(() => imageDataUrlToBlob('data:image/png,%GG')).toThrow(
      '無效的圖片 data URL 編碼',
    );
  });
});
