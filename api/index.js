// api/index.js
// Root package.json has "type": "module", so this file is ESM
// server/dist/index.js is CommonJS (compiled with module: "commonjs")
// Importing CJS from ESM: module.exports becomes the default import
import server from '../server/dist/index.js';
const app = server.default || server;
export default app;
