const Koa = require('koa');
const Router = require('koa-router');
const websockify = require('../');

const app = new Koa();
const api = new Router();

api.get('/*', (ctx) => {
  ctx.websocket.send('Hello World');
  ctx.websocket.on('message', (message) => {
    console.log(message);
  });
  delete ctx.websocket;
});

app.use(api.routes())
  .use(api.allowedMethods());

websockify(app)._webSocketsListen(app.listen(3000));
