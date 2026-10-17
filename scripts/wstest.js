const { io } = require('/www/wwwroot/evoting/node_modules/socket.io-client');
const s = io('https://evoting.sman1bantarujeg.sch.id', {
  path: '/api/socketio',
  transports: ['websocket'],
  timeout: 15000,
});
let done = false;
s.on('connect', () => console.log('WS CONNECTED', s.id, 'transport=', s.io.engine.transport.name));
s.on('message', (m) => { console.log('MSG', JSON.stringify(m).slice(0, 120)); if (!done) { done = true; s.close(); process.exit(0); } });
s.on('connect_error', (e) => { console.log('CONNECT_ERROR', e.message); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 20000);
