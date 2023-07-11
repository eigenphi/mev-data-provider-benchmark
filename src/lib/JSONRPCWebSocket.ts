import JSONRPC, { JSONRPCClient } from "json-rpc-2.0";
import EventEmitter from "node:events";
import WebSocket from "ws";

export default JSONRPC;
export class JSONRPCWebSocket extends JSONRPCClient {
    constructor (ws: WebSocket | string) {
        super((rpcRequest: JSONRPC.JSONRPCRequest) => {
            try {
                this._ws.send(JSON.stringify(rpcRequest));
                return Promise.resolve();
            } catch (error) {
                return Promise.reject(error);
            }
        });
        if (typeof ws == "string") {
            this._ws = new WebSocket(ws);
        } else {
            this._ws = ws;
        }
        this._ws.onopen = function () {
            // resolve(server);
        };
        this._ws.onerror = function (err) {
            // reject(err);
        };
        this._ws.onmessage = (event: WebSocket.MessageEvent) => {
            let data = JSON.parse(event.data.toString());
            if (typeof data.params?.subscription == "string") {
                this._eventEmitter.emit(data.params.subscription, data.params.result)
            } else {
                this.receive(data)
            }
        };
        this._ws.onclose = (event) => {
            this.rejectAllPendingRequests(
                `${ws} Connection closed (${event.reason}).`
            );
        };
    }
    private _ws: WebSocket;
    public connect(): Promise<WebSocket> {
        let ws = this._ws;
        return new Promise(function (resolve, reject) {
            ws.onopen = function () {
                resolve(ws);
            };
            ws.onerror = function (err) {
                reject(err);
            };
        });
    }
    /**
     * disconnect
     */
    public disconnect(): void {
        this._ws.close()
    }
    private _eventEmitter = new EventEmitter();
    public subscribe(subscription: string, handler: any): void {
        this._eventEmitter.on(subscription, handler);
    }
    public clearSubscription = this._eventEmitter.removeAllListeners
}