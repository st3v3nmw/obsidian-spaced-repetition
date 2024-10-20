// https://stackoverflow.com/a/69019874
type ObjectType = Record<PropertyKey, unknown>;
type PickByValue<OBJ_T, VALUE_T> = // https://stackoverflow.com/a/55153000
    Pick<
        OBJ_T,
        {
            [K in keyof OBJ_T]: OBJ_T[K] extends VALUE_T ? K : never;
        }[keyof OBJ_T]
    >;
type ObjectEntries<OBJ_T> = // https://stackoverflow.com/a/60142095
    {
        [K in keyof OBJ_T]: [keyof PickByValue<OBJ_T, OBJ_T[K]>, OBJ_T[K]];
    }[keyof OBJ_T][];
export function getTypedObjectEntries<OBJ_T extends ObjectType>(obj: OBJ_T): ObjectEntries<OBJ_T> {
    return Object.entries(obj) as ObjectEntries<OBJ_T>;
}

/**
 * Returns an array of the keys of an object with type `(keyof T)[]`
 * instead of `string[]`
 * Please see https://stackoverflow.com/a/59459000 for more details
 *
 * @param obj - An object
 * @returns An array of the keys of `obj` with type `(keyof T)[]`
 */
export const getKeysPreserveType = Object.keys as <T extends Record<string, unknown>>(
    obj: T,
) => Array<keyof T>;

export function mapRecord<T, U, V extends string | number | symbol>(
    record: Record<string, T>,
    transform: (key: string, value: T) => [V, U],
): Record<V, U> {
    return Object.fromEntries(
        Object.entries(record).map(([key, value]) => transform(key, value)),
    ) as Record<V, U>;
}
