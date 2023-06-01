import { sleep } from './sleep';

type Task<T> = () => Promise<T>;

type Options = {
    maxTries: number;
    sleepInMs: number;
};

export async function retryUntil<T>(task: Task<T>, { maxTries, sleepInMs }: Options): Promise<T | undefined> {
    for (let tries = 1; tries <= maxTries; tries++) {
        const result = await task();
        if (result) {
            return result;
        }
        console.log('[%d/%d] retrying after %d ms...', tries, maxTries, sleepInMs);
        await sleep(sleepInMs);
    }
}
