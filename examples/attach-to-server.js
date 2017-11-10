/*
 * Don't use app.listen(), instead attach to existing server
 */

const Koa = require('koa');
const Router = require('koa-router');
const http = require('http'); // or 'https'
const webSockify = require('../');

const app = new Koa();
const router = new Router();
const server = http.createServer(app.callback());

// WebSocket routes
router.get('/*', (ctx) => {
  if (!ctx.websocket) { ctx.throw(400, `ERROR: ${ctx.url} only handles WebSocket requests`); }
  ctx.websocket.send('Hello World');
  ctx.websocket.on('message', (message) => {
    console.log(message);
  });
  delete ctx.websocket;
});

app.use(router.routes())
   .use(router.allowedMethods());

// attach WebSockets to existing server
webSockify(app)._webSocketsListen(server);

// start server
server.listen(3000);
