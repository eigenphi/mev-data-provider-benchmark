import 'dotenv/config';
import { parentPort } from 'worker_threads';
import { LRUCache } from "lru-cache";
import WebSocket from "ws";
import { WorkerMessage } from '../types/WorkerMessage';
import { Alchemy, Network } from "alchemy-sdk";
import { Block, BlockHeaderOutput } from "web3-types";
import JSONRPC, { JSONRPCWebSocket } from "../lib/JSONRPCWebSocket";
import { logBlockMEVMatching, logTransactionRecived, MatchedTransaction } from './logger';

const BLOCK_METRIC_DELAY = 10 * 60 * 1000 // delay block metric for 10m, to wait MEV analyse result.
const cache = new LRUCache<string, TransactionInfo>({
    max: 100000
});
type TransactionInfo = {
    sources: string[];
    timestamps: number[];
    matchedMEV?: string;
    profit?: number;
};
const DEFAULT_TRANSACTION_INFO: TransactionInfo = {
    sources: [],
    timestamps: []
}
function clone(o: any): any {
    return JSON.parse(JSON.stringify(o));
}
function routeMessage(message: WorkerMessage): void {
    if (message.type == "pendingTransaction") {
        let transactionInfo = cache.get(message.data.hash) || clone(DEFAULT_TRANSACTION_INFO);
        transactionInfo.sources.push(message.data.source);
        transactionInfo.timestamps.push(message.data.timestamp);

        cache.set(message.data.hash, transactionInfo);
        logTransactionRecived({
            hash: message.data.hash,
            source: message.data.source,
            timestamp: message.data.timestamp
        })
    }
}
parentPort?.on("message", routeMessage);

function matchMEV(mevTransaction: any): void {
    if (mevTransaction.chain == "ethereum") {
        let signalTransactions: string[] = [];

        if (mevTransaction.type == "Sandwich") {
            mevTransaction.sandwichDetails.forEach((detail: { sandwichRole: string; transactionHash: string; }) => {
                if (detail.sandwichRole == "Victim") {
                    signalTransactions.push(detail.transactionHash)
                }
            })
        } else {
            signalTransactions.push(mevTransaction.transactionHash)
        }
        signalTransactions.forEach(hash => {
            let matchedInfo: TransactionInfo = cache.get(hash) || clone(DEFAULT_TRANSACTION_INFO);
            if (matchedInfo.sources?.length && matchedInfo.timestamps?.length) {
                console.log("---------");
                console.log(`Matched: ${hash}`);
                console.log(`MevTransaction: ${mevTransaction.transactionHash}`);
                console.log(`Block: ${mevTransaction.blockNumber.toString(10)}`);
                console.log("Source: ", matchedInfo.sources.join(" | "));
                console.log("Provided Before Block: ", matchedInfo.timestamps.map(t => mevTransaction.blockTimestamp * 1000 - t).join(" | "));
                console.log("Profit: ", mevTransaction.profit ? "$" + (mevTransaction.profit / signalTransactions.length).toFixed(2) : null);
                console.log("---------");
            }
            cache.set(hash, {
                sources: matchedInfo.sources,
                timestamps: matchedInfo.timestamps,
                matchedMEV: mevTransaction.transactionHash,
                profit: mevTransaction.profit / signalTransactions.length
            })
        });
    }
}
function connectLiveStream(): void {
    let mevLiveStream = new WebSocket("ws://34.145.121.29");
    mevLiveStream.onopen = () => console.info("Mev Live Stream connected.");
    mevLiveStream.onmessage = (event: WebSocket.MessageEvent) => matchMEV(JSON.parse(event.data.toString()));
    mevLiveStream.onclose = connectLiveStream;
}
connectLiveStream();

function matchMined(block: Block) {
    let transactions: MatchedTransaction[] = [];
    let tmpSources: any = {};
    let cachedCount = 0;
    block.transactions?.forEach(t => {
        let hash = typeof t == "string" ? t : t.hash.toString();
        let receivedTransaction = cache.get(hash);

        if (receivedTransaction) {
            cachedCount ++ 
        } else {
            receivedTransaction = clone(DEFAULT_TRANSACTION_INFO);
        }
        transactions.push(Object.assign({ hash }, receivedTransaction));
        // analyze data sources
        receivedTransaction?.sources.forEach((s: string | number) => tmpSources[s] = 1)

    });
    return {
        transactions,
        sources: Object.keys(tmpSources),
        cachedCount
    };
}
function metricMined(block: any) {
    if (!block) {
        return
    }

    let matchedBlock = matchMined(block);
    let blockNumber = block.number.toString(16);
    console.log(`block: ${parseInt(blockNumber, 16)}, transaction: ${block.transactions.length}, source:`, matchedBlock.sources.join(','));

    let m = new Array<number>(matchedBlock.sources.length + 1);
    m.fill(0);
    matchedBlock.transactions.forEach(t => {
        t.sources.forEach(s => {
            m[matchedBlock.sources.indexOf(s)]++
        })
        if (t.sources.length == matchedBlock.sources.length) {
            m[m.length - 1]++;
        }
    });
    console.log(m);

    setTimeout(() => {
        let matched = matchMined(block);
        console.log("Mined Transaction cached: ", `${parseInt(blockNumber, 16)} ${matched.cachedCount}/${block.transactions.length}`)
        logBlockMEVMatching({
            blockNumber: block.number,
            blockTimestamp: block.blockTimestamp,
            transactions: matched.transactions
        })
    }, BLOCK_METRIC_DELAY);
}

const API_KEY_INFURA: string = process.env.METRIC_API_KEY_INFURA || '';
async function subMinedInfura() {
    const rpcClient = new JSONRPCWebSocket(`wss://mainnet.infura.io/ws/v3/${API_KEY_INFURA}`);
    await rpcClient.connect();

    console.info("Metric provider Infura connected.");
    rpcClient.request("eth_subscribe", ["newHeads"])
        .then(subscription => {
            rpcClient.subscribe(subscription, (result: BlockHeaderOutput) => {
                rpcClient.request("eth_getBlockByNumber", [result.number, false])
                    .then((block: Block) => metricMined({
                        number: block.number,
                        transactions: block.transactions
                    }), rpcClientError);
            });
        }, rpcClientError);
    function rpcClientError(reason: JSONRPC.JSONRPCErrorException): void {
        console.error("Request Error:", reason.code, reason.message, reason.data);
        // -32005 daily request count exceeded
        if (reason?.code == -32005) {
            console.info(`
                newHeads pushed mush less frequently than Infura RPS limit after daily request count exceeded (1/s).
                So this will be recover in 30s. 2 or 3 block info would lost.
                If mind, use Alchemy as metric provider.
            `);
        }
    }
}

const alchemySettings = {
    apiKey: process.env.METRIC_API_KEY_ALCHEMY, // Replace with your Alchemy API Key
    network: Network.ETH_MAINNET, // Replace with your network
};
async function subMinedAlchemy() {
    const alchemy = new Alchemy(alchemySettings);
    // Subscribe to new blocks, or newHeads
    alchemy.ws.on("block", (blockNumber) =>
        alchemy.core.getBlock(blockNumber).then(block => {
            metricMined({
                number: block.number,
                transactions: block.transactions
            })
        }, console.error).catch(console.error)
    );
}

async function subMined() {
    if (process.env.METRIC_API_KEY_ALCHEMY) {
        subMinedAlchemy()
    } else if (process.env.METRIC_API_KEY_INFURA) {
        subMinedInfura()
    } else {
        console.error("No Metric data provider is set, please check your environment settings.");
    }
}
subMined();