export function imageDataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || commaIndex < 0) {
    throw new Error('無效的圖片 data URL');
  }

  const [mimeType, ...parameters] = dataUrl.slice(5, commaIndex).split(';');
  if (!mimeType?.toLowerCase().startsWith('image/')) {
    throw new Error('無效的圖片 data URL');
  }

  const payload = dataUrl.slice(commaIndex + 1);
  let bytes: Uint8Array<ArrayBuffer>;

  if (parameters.some((parameter) => parameter.toLowerCase() === 'base64')) {
    const decoded = atob(payload);
    bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } else {
    const byteValues: number[] = [];
    let rawText = '';
    const flushRawText = (): void => {
      for (const byte of new TextEncoder().encode(rawText)) {
        byteValues.push(byte);
      }
      rawText = '';
    };

    for (let index = 0; index < payload.length; ) {
      if (payload[index] === '%') {
        const hex = payload.slice(index + 1, index + 3);
        if (!/^[\da-f]{2}$/i.test(hex)) {
          throw new Error('無效的圖片 data URL 編碼');
        }
        flushRawText();
        byteValues.push(Number.parseInt(hex, 16));
        index += 3;
        continue;
      }

      const codePoint = payload.codePointAt(index);
      if (codePoint === undefined) break;
      rawText += String.fromCodePoint(codePoint);
      index += codePoint > 0xffff ? 2 : 1;
    }
    flushRawText();
    bytes = Uint8Array.from(byteValues);
  }

  return new Blob([bytes], { type: mimeType });
}
