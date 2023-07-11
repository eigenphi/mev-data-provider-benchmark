import { WebSocket, WebSocketServer } from 'ws';

export const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws, req) {
    ws.on('error', console.error);
    console.log(`Aggregator Client: ${req.socket.remoteAddress} connected.`);
});
wss.on('listening', () => {
    console.log(`Pending Transactions Aggregator outputing on port: ${wss.options.port}`);
})
