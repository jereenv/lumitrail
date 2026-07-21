import { Utf16CapableTextDecoder, installTextDecoderPolyfill } from './textDecoder';

/**
 * Encode a JS string to UTF-16LE bytes — the exact byte layout Emscripten's
 * h3-js glue hands to `TextDecoder('utf-16le').decode(...)` on a device.
 */
function toUtf16leBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i += 1) {
    const codeUnit = text.charCodeAt(i);
    bytes[i * 2] = codeUnit & 0xff;
    bytes[i * 2 + 1] = (codeUnit >> 8) & 0xff;
  }
  return bytes;
}

describe('Utf16CapableTextDecoder', () => {
  it('decodes ASCII UTF-16LE bytes (the case that crashed Hermes)', () => {
    const decoder = new Utf16CapableTextDecoder('utf-16le');
    expect(decoder.encoding).toBe('utf-16le');
    expect(decoder.decode(toUtf16leBytes('hi'))).toBe('hi');
  });

  it('decodes multi-byte code points and surrogate pairs', () => {
    const decoder = new Utf16CapableTextDecoder('utf-16le');
    // 'é' (U+00E9) is a two-byte code unit; '😀' (U+1F600) is a surrogate pair.
    expect(decoder.decode(toUtf16leBytes('café 😀'))).toBe('café 😀');
  });

  it('decodes a large buffer without overflowing the argument limit', () => {
    const text = 'x'.repeat(50_000);
    const decoder = new Utf16CapableTextDecoder('utf-16le');
    expect(decoder.decode(toUtf16leBytes(text))).toBe(text);
  });

  it('emits the replacement character for a trailing odd byte', () => {
    const decoder = new Utf16CapableTextDecoder('utf-16le');
    // Two full code units for 'A''B' plus one dangling byte.
    const bytes = new Uint8Array([0x41, 0x00, 0x42, 0x00, 0x21]);
    expect(decoder.decode(bytes)).toBe('AB�');
  });

  it('accepts a subarray view (what Emscripten passes)', () => {
    const backing = new Uint8Array([0xff, 0xff, ...toUtf16leBytes('ok'), 0xff]);
    const view = backing.subarray(2, 6);
    const decoder = new Utf16CapableTextDecoder('utf-16le');
    expect(decoder.decode(view)).toBe('ok');
  });

  it('delegates utf-8 to the platform decoder', () => {
    const decoder = new Utf16CapableTextDecoder('utf-8');
    expect(decoder.encoding).toBe('utf-8');
    const utf8 = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]); // 'hello'
    expect(decoder.decode(utf8)).toBe('hello');
  });

  it('installTextDecoderPolyfill is idempotent and safe to call', () => {
    expect(() => {
      installTextDecoderPolyfill();
      installTextDecoderPolyfill();
    }).not.toThrow();
  });
});
