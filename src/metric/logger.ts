import { type } from "os";
import winston from "winston";
import 'winston-daily-rotate-file';

const TransactionRecivedLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.DailyRotateFile({
            level: 'info',
            filename: './logs/transaction-recived-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d'
        })
    ]
});
type TransactionRecived = {
    hash: string;
    source: string;
    timestamp: number;
}
export function logTransactionRecived(transactionInfo: TransactionRecived): void {
    TransactionRecivedLogger.info(transactionInfo);
}


const BlockMEVMatchingLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.DailyRotateFile({
            level: 'info',
            filename: './logs/block-mev-matching-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d'
        })
    ]
});

export type MatchedTransaction = {
    hash: string;
    sources: string[];
    timestamps: number[];
    profit?: number;
}
export type BlockMEVMatching = {
    blockNumber: number;
    blockTimestamp: number;
    transactions: MatchedTransaction[];
}
export function logBlockMEVMatching(blockInfo: BlockMEVMatching): void {
    BlockMEVMatchingLogger.info(blockInfo)
}
