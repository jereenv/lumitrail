// Must be first: installs the UTF-16LE TextDecoder polyfill that h3-js needs on
// Hermes, before any module that imports h3-js is loaded. See the module doc.
import './src/app/polyfills';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
