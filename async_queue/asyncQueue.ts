import { Mutex } from './mutex';

export class AsyncQueue {
	constructor(private readonly mutexInstance: Mutex) {}

	async add(func: () => Promise<void>) {
		const unlock = await this.mutexInstance.lock();
		const res = await func();
		await unlock();

		return res;
	}
}
