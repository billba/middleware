import { IStorage } from './storage';

export class MemoryStorage implements IStorage {
    constructor(
        private storage: Record<string, any> = {}
    ) {
    }

    get(
        key: string,
    ) {
        return this.storage[key];
    }

    set(
        key: string,
        value: any,
    ) {
        this.storage[key] = value;
    }
}
