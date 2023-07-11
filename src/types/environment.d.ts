export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            METRIC_ENABLE?:boolean;
            METRIC_API_KEY_ALCHEMY?: string;
            METRIC_API_KEY_INFURA?: string;
            API_KEY_ALCHEMY?: string;
            API_KEY_BLOXROUTE?: string;
            API_KEY_BLAST?: string;
            API_KEY_ETHERSCAN?: string;
            API_KEY_INFURA?: string;
        }
    }
}