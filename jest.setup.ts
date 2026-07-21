// Jest global setup.
//
// The domain and data layers are deliberately free of React Native / Expo
// runtime imports, so their unit and integration suites run as pure Node with
// no native mocks required. The location provider and persistence layer are
// injected via interfaces, letting tests supply in-memory fakes.
//
// The one shim we need: jest-expo installs Expo's "winter" TextDecoder
// polyfill, which does not support the `utf-16le` encoding that the h3-js WASM
// glue relies on. We restore Node's spec-complete implementation. This runs in
// setupFilesAfterEnv, i.e. after the preset's polyfill, so ours wins.
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'node:util';

Object.defineProperty(globalThis, 'TextDecoder', {
  value: NodeTextDecoder,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'TextEncoder', {
  value: NodeTextEncoder,
  configurable: true,
  writable: true,
});
