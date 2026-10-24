import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { Aedes } from 'aedes';
import { WebSocketServer, createWebSocketStream } from 'ws';

export async function startBroker({ port = 9001, host = '0.0.0.0', quiet = false } = {}) {
  const broker = await Aedes.createBroker();
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('IoT Control: broker MQTT via WebSocket em /mqtt.\n');
  });
  const sockets = new WebSocketServer({ server, path: '/mqtt', handleProtocols: protocols => protocols.has('mqtt') ? 'mqtt' : false });
  sockets.on('connection', (socket, request) => broker.handle(createWebSocketStream(socket), request));
  broker.on('clientError', (_client, error) => { if (!quiet) console.warn('Cliente MQTT:', error.message); });
  await new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(port, host, resolve);
  });
  if (!quiet) console.log(`Broker local pronto: ws://localhost:${port}/mqtt (WebSocket, não TCP 1883).`);
  return { broker, server, close: async () => {
    for (const client of sockets.clients) client.terminate();
    await new Promise(resolve => broker.close(resolve));
    await new Promise(resolve => sockets.close(resolve));
    await new Promise(resolve => server.close(resolve));
  } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const instance = await startBroker({ port: Number(process.env.BROKER_PORT ?? 9001) });
  const shutdown = async () => { await instance.close(); process.exit(0); };
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
}
