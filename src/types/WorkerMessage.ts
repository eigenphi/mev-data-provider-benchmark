import { Transaction } from "web3-types";

type PendingTransactionData = {
    transaction: Transaction;
    /**
     * transaction hash.
     */
    hash: string;
    source: string;
    /**
     * timestamp of when the transaction received.
     */
    timestamp: number;
    /**
     * time span when get Transaction.
     */
    span?: number;
}

export type WorkerMessage = {
    type: "pendingTransaction";
    data: PendingTransactionData;
}