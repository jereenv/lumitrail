/**
 * App-startup polyfills. Importing this module for its side effect installs
 * every runtime shim the app needs before its feature modules load.
 *
 * Import this FIRST in the entry point (`index.ts`), before anything that can
 * transitively import `h3-js`.
 */
import { installTextDecoderPolyfill } from './textDecoder';

installTextDecoderPolyfill();
