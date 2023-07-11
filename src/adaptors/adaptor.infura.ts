import 'dotenv/config';
import JSONRPC, { JSONRPCWebSocket } from "../lib/JSONRPCWebSocket";
import { parentPort } from 'worker_threads';
import { report } from "../lib/workerkit";
import { Transaction } from 'web3';

const API_KEY_INFURA: string = process.env.API_KEY_INFURA || "";

/**
 * modify respondedTransaction to match Transaction if needed.
 * 
 * @param respondedTransaction any transaction from API
 * @returns standard transaction ({@link Transaction}).
 */
function toStandardTransaction(respondedTransaction: any): Transaction {
    let standardTransaction = respondedTransaction;

    return standardTransaction;
}

let IsAdaptorRunning: boolean = false;
export async function main(): Promise<void> {
    if (IsAdaptorRunning) {
        console.info("Infura is still running.")
        return
    }
    IsAdaptorRunning = true;
    const rpcClient = new JSONRPCWebSocket(`wss://mainnet.infura.io/ws/v3/${API_KEY_INFURA}`);
    try {
        await rpcClient.connect();
    } catch (error: any) {
        console.error("Infura Connection Error:", error.message , error);
        return;
    }
   

    console.info("Adaptor for Infura connected.");

    rpcClient.request("eth_subscribe", ["newPendingTransactions"])
        .then(subscription => {
            rpcClient.subscribe(subscription, (result: string) => {
                rpcClient.request("eth_getTransactionByHash", [result])
                    .then(transaction => {
                        if (transaction !== null) {
                            report(parentPort, {
                                type: "pendingTransaction",
                                data: {
                                    transaction: toStandardTransaction(transaction),
                                    hash: transaction.hash,
                                    source: "infura",
                                    timestamp: new Date().valueOf(),
                                    span: 0
                                }
                            })
                        } else {
                            // console.info(`Can not resolve Transaction: ${result}`)
                        }
                    }, rpcClientError);
            });
        }, rpcClientError);
    function rpcClientError(reason: JSONRPC.JSONRPCErrorException): void {
        console.warn("Request Error:", reason.code, reason.message, reason.data);

        // -32005 daily request count exceeded
        if (reason?.code == -32005) {
            rpcClient.clearSubscription();
            rpcClient.rejectAllPendingRequests("Infura daily request count exceeded");
            rpcClient.disconnect();
            IsAdaptorRunning = false;
        }
    }

    // rpcClient.request("eth_blockNumber", []).then(result => console.log('eth_blockNumber:', result));
    // rpcClient.request("eth_getTransactionByHash", ["0x419aa0a4fd9d9263b54d4ef95022032a4b186e28c792f7e93a66af3c91c1b723"]).then(result => console.log('eth_getTransactionByHash:', result));
    // let pingTimer = new Timer()
    // rpcClient.request("eth_chainId", []).then(result => console.log("ping:", pingTimer.resolve()));
    // rpcClient.request("eth_blockNumber", []).then(result => console.log("ping:", pingTimer.resolve()));

    // // rpcClient.request("eth_blockNumber", []).then(result => console.log('eth_blockNumber:', result));
    // setInterval(() => {
    //     let pingTimer = new Timer()
    //     rpcClient.request("eth_chainId", []).then(result => console.log("ping:", pingTimer.resolve()));
    // }, 1000)
}

if (API_KEY_INFURA) {
    main();
    
    // Retry daily limit every hour.
    setInterval(main, 60 * 60 * 1000);
}