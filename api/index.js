// Vercel Serverless Function Entry Point
// TypeScript compiles 'export default app' to 'exports.default = app'
// so we need to handle both CommonJS and ESM-interop exports
const server = require('../server/dist/index.js');
const app = server.default || server;
module.exports = app;
