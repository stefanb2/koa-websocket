const assert = require('assert');
const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const Koa = require('koa');
const route = require('koa-route');

const koaws = require('..');

describe('should route ws messages seperately', () => {
  const app = new Koa();

  app.use(route.all('/abc', (ctx) => {
    ctx.websocket.on('message', function _(message) {
      this.send(message);
    });
    delete ctx.websocket;
  }));

  app.use(route.all('/def', (ctx) => {
    ctx.websocket.on('message', function _(message) {
      this.send(message);
    });
    delete ctx.websocket;
  }));

  app.use((ctx, next) => {
    ctx.websocket.on('message', function _(message) {
      if (message === '123') {
        this.send(message);
      }
    });
    delete ctx.websocket;
    return next();
  });

  let server = null;

  before((done) => {
    server = app.listen(done);
    koaws(app)._webSocketsListen(server);
  });

  after((done) => {
    server.close(done);
  });

  it('sends 123 message to any route', (done) => {
    const ws = new WebSocket(`ws://localhost:${server.address().port}/not-a-route`);
    ws.on('open', () => {
      ws.send('123');
    });
    ws.on('message', (message) => {
      assert(message === '123');
      done();
      ws.close();
    });
  });

  it('sends abc message to abc route', (done) => {
    const ws = new WebSocket(`ws://localhost:${server.address().port}/abc`);
    ws.on('open', () => {
      ws.send('abc');
    });
    ws.on('message', (message) => {
      assert(message === 'abc');
      done();
      ws.close();
    });
  });

  it('sends def message to def route', (done) => {
    const ws = new WebSocket(`ws://localhost:${server.address().port}/def`);
    ws.on('open', () => {
      ws.send('def');
    });
    ws.on('message', (message) => {
      assert(message === 'def');
      done();
      ws.close();
    });
  });

  it('handles urls with query parameters', (done) => {
    const ws = new WebSocket(`ws://localhost:${server.address().port}/abc?foo=bar`);
    ws.on('open', () => {
      ws.send('abc');
    });
    ws.on('message', (message) => {
      assert(message === 'abc');
      done();
      ws.close();
    });
  });
});

describe('should support custom ws server options', () => {
  const app = new Koa();
  const websockified = koaws(app, {
    handleProtocols(protocols) {
      if (protocols.indexOf('bad_protocol') !== -1) { return false; }
      return protocols.pop();
    },
  });

  let server = null;

  before((done) => {
    server = app.listen(done);
    websockified._webSocketsListen(server);
  });

  after((done) => {
    server.close(done);
  });

  it('reject bad protocol use wsOptions', (done) => {
    const ws = new WebSocket(`ws://localhost:${server.address().port}/abc`, ['bad_protocol']);
    ws.on('error', () => {
      assert(true);
      done();
      ws.close();
    });
  });
});

describe('should support custom http server options', () => {
  // The cert is self-signed.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const secureApp = new Koa();
  const websockified = koaws(secureApp);
  const server = https.createServer({
    key: fs.readFileSync('./test/key.pem'),
    cert: fs.readFileSync('./test/cert.pem'),
  }, secureApp.callback());

  before((done) => {
    websockified._webSocketsListen(server);
    server.listen(done);
  });

  after((done) => {
    server.close(done);
  });

  it('supports wss protocol', (done) => {
    const ws = new WebSocket(`wss://localhost:${server.address().port}/abc`);
    ws.on('open', () => {
      assert(true);
      done();
      ws.close();
    });
  });
});
