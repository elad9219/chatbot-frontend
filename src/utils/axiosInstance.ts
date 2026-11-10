import axios from 'axios';
import globals from './globals';

const axiosInstance = axios.create({ timeout: 25_000 });
const healthUrl = new URL('/actuator/health', globals.api.chat).toString();

function pause(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise(resolve => {
        if (signal.aborted) {
            resolve();
            return;
        }
        const finish = () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', finish);
            resolve();
        };
        const timer = setTimeout(finish, ms);
        signal.addEventListener('abort', finish, { once: true });
    });
}

async function pollHealth(signal: AbortSignal): Promise<void> {
    const deadline = Date.now() + 40_000;
    while (!signal.aborted) {
        const timeLeft = deadline - Date.now();
        if (timeLeft <= 0) break;
        try {
            const response = await axiosInstance.get<{ status?: string }>(healthUrl, {
                signal,
                timeout: Math.min(4_000, timeLeft),
            });
            if (response.data?.status === 'UP') {
                return;
            }
        } catch {
            // Only the read-only health probe may be retried.
        }
        const remaining = deadline - Date.now();
        if (remaining > 0) {
            await pause(Math.min(2_500, remaining), signal);
        }
    }
    throw new Error('Backend did not become ready');
}

export function createBackendReadiness(signal: AbortSignal) {
    let readyUntil = 0;
    let pending: Promise<void> | undefined;

    return {
        wait(): Promise<void> {
            if (!signal.aborted && Date.now() < readyUntil) {
                return Promise.resolve();
            }
            if (!pending) {
                pending = pollHealth(signal).then(() => {
                    readyUntil = Date.now() + 15_000;
                }).finally(() => {
                    pending = undefined;
                });
            }
            return pending;
        },
        invalidate() {
            readyUntil = 0;
        },
    };
}

export default axiosInstance;