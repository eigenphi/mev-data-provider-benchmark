import 'dotenv/config';
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import { Transaction } from "web3-types";
import { parentPort } from 'worker_threads';
import { report } from "../lib/workerkit";

const settings = {
    apiKey: process.env.API_KEY_ALCHEMY || "", // Replace with your Alchemy API Key
    network: Network.ETH_MAINNET, // Replace with your network
};

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

async function main(): Promise<void> {
    const alchemy = new Alchemy(settings);
    console.info("Adaptor for Alchemy connected.");
    // Subscription for Alchemy's pendingTransactions API
    alchemy.ws.on({ method: AlchemySubscription.PENDING_TRANSACTIONS },
        (transaction) => {
            report(parentPort, {
                type: "pendingTransaction",
                data: {
                    transaction: toStandardTransaction(transaction),
                    hash: transaction.hash,
                    source: "alchemy",
                    timestamp: new Date().valueOf(),
                    span: 0
                }
            });
        }
    );
}
if (settings.apiKey) {
    main();
}