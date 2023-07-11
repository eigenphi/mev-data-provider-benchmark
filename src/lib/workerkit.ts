import { WorkerMessage } from "../types/WorkerMessage";
import { MessagePort } from "worker_threads";

/**
 * report message to port
 * 
 * @param messagePort {@link MessagePort} which port to report through.
 * @param message {@link WorkerMessage} message to report.
 */
export function report(messagePort: MessagePort | null, message: WorkerMessage): void {
    if (messagePort) {
        messagePort.postMessage(message);
    } else {
        console.log(JSON.stringify(message));
    }
}