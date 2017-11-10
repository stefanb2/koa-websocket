/*
 * Serve HTTP & WebSockets in same application
 */

const Koa = require('koa');
const Router = require('koa-router');
const webSockify = require('../');

const app = new Koa();
const router = new Router();

// HTTP routes
router.get('/http', (ctx) => {
  if (ctx.websocket) { ctx.throw(400, `ERROR: ${ctx.url} does not handle WebSocket requests`); }
  ctx.body = 'Hello World';
});

// WebSocket routes
router.get('/websocket', (ctx) => {
  if (!ctx.websocket) { ctx.throw(400, `ERROR: ${ctx.url} only handles WebSocket requests`); }
  ctx.websocket.send('Hello World');
  ctx.websocket.on('message', (message) => {
    console.log(message);
  });
  delete ctx.websocket;
});

app.use(router.routes())
   .use(router.allowedMethods());

// reject unimplemented routes
app.use((ctx) => {
  ctx.throw(404, `ERROR: ${ctx.url} not implemented`);
});

// start server
webSockify(app)._webSocketsListen(app.listen(3000));
