import 'dotenv/config';
import Web3 from "web3";
import { Transaction } from "web3-types";
import { parentPort } from 'worker_threads';
import { Timer } from "../lib/timer";
import { report } from "../lib/workerkit";

//TODO: move api key to user environment
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
function startInfura() {
    const infuraProvider = new Web3.providers.WebsocketProvider(`wss://mainnet.infura.io/ws/v3/${API_KEY_INFURA}`);
    const infuraWeb3 = new Web3(infuraProvider);
    const infuraWeb3Http = new Web3(`https://mainnet.infura.io/v3/${API_KEY_INFURA}`);
    infuraProvider.on("disconnect", _e => {
        console.log('infuraProvider disconnected');
        infuraProvider.connect();
    });
    infuraProvider.on("connect", () => {
        console.log('infuraProvider connected');
        infuraWeb3.eth.subscribe('pendingTransactions')
            .then(sub => {
                sub.on('data', txHash => {
                    let getTransactionTimer = new Timer();
                    infuraWeb3.eth.getTransaction(txHash).then(transaction => {
                        report(parentPort, {
                            type: "pendingTransaction",
                            data: {
                                transaction: toStandardTransaction(transaction),
                                hash: txHash,
                                source: "infura",
                                timestamp: new Date().valueOf(),
                                span: getTransactionTimer.resolve()
                            }
                        });
                    }, rejects => {
                        // console.info(`Code: ${rejects.code}, Can not resolve Transaction: ${txHash}`, getTransactionTimer.resolve());
                    }).catch(error => {
                        console.info(`Code: ${error.code}, ${error.message}`);
                    })
                })
            }, rejects => {
                console.info(`Code: ${rejects.code}, ${rejects.message}`);
            }).catch(error => {
                console.info(`Code: ${error.code}, ${error.message}`);
            });
    })
}
async function main(config: any): Promise<void> {
    try {
        startInfura()
    } catch (error) {
        console.log("main catch");
        console.error(error);
    }
}

// Run the worker
const config = {};
main(config);