
export type Promiseable <T> = T | Promise<T>;

export const toPromise = <T> (t: Promiseable<T>) => t instanceof Promise ? t : Promise.resolve(t);

const mapObject = <K extends string, T, U> (obj: Record<K, T>, f: (key: K, value: T) => U) =>
    Object.keys(obj).reduce(
        (prev, key: K) => {
            prev[key] = f(key, obj[key]);
            return prev;
        },
        {} as Record<K, U>
    );
