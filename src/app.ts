import { Worker } from 'worker_threads';
import { WorkerMessage } from './types/WorkerMessage';
import { wss } from "./webSocketServer";

let metricator: Worker;

/**
 * Route Adaptor messages to handlers
 * @param message {@link WorkerMessage} message from adaptor
 */
function routeWorkerMessage(message: WorkerMessage): void {
    // console.log(`Type: ${message?.type}`);
    // console.log(`${message?.data.source}: ${message.data.hash}, ${message.data.time}`);

    wss.clients.forEach(client =>
        client.send(JSON.stringify(message.data.transaction, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )));

    if (process.env.METRIC_ENABLE && metricator) {
        metricator.postMessage(message);
    }
}

export default async function main(): Promise<void> {
    // TODO: auto load adaptors
    // load adaptor
    const adaptorInfura = new Worker('./src/adaptors/adaptor.loader.js', {
        workerData: {
            provider: "infura"
        }
    });
    adaptorInfura.on("message", routeWorkerMessage)

    // load adaptor
    const adaptorAlchemy = new Worker('./src/adaptors/adaptor.loader.js', {
        workerData: {
            provider: "alchemy"
        }
    });
    adaptorAlchemy.on("message", routeWorkerMessage)

    // load metric
    if (process.env.METRIC_ENABLE) {
        metricator = new Worker("./src/metric/metric.loader.js");
    }
}

if (require.main === module) {
    // Run the application
    main();
}