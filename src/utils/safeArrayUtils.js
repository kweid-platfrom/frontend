/* eslint-disable import/no-anonymous-default-export */
/**
 * Utility functions for safe array operations
 * Prevents "Cannot read properties of undefined (reading 'length')" errors
 */

/**
 * Safely get array length, returns 0 if not an array or undefined
 * @param {any} arr - The potential array
 * @returns {number} - The length of the array or 0
 */
export const safeLength = (arr) => {
    return Array.isArray(arr) ? arr.length : 0;
};

/**
 * Safely ensure a value is an array
 * @param {any} value - The value to convert to array
 * @returns {Array} - An array (original if already array, empty if null/undefined, wrapped if single value)
 */
export const safeArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
};

/**
 * Safely filter an array
 * @param {any} arr - The potential array
 * @param {Function} predicate - The filter function
 * @returns {Array} - Filtered array or empty array
 */
export const safeFilter = (arr, predicate) => {
    return Array.isArray(arr) ? arr.filter(predicate) : [];
};

/**
 * Safely map an array
 * @param {any} arr - The potential array
 * @param {Function} mapper - The map function
 * @returns {Array} - Mapped array or empty array
 */
export const safeMap = (arr, mapper) => {
    return Array.isArray(arr) ? arr.map(mapper) : [];
};

/**
 * Safely find an item in an array
 * @param {any} arr - The potential array
 * @param {Function} predicate - The find function
 * @returns {any} - Found item or undefined
 */
export const safeFind = (arr, predicate) => {
    return Array.isArray(arr) ? arr.find(predicate) : undefined;
};

/**
 * Safely check if array includes an item
 * @param {any} arr - The potential array
 * @param {any} item - The item to check for
 * @returns {boolean} - True if found, false otherwise
 */
export const safeIncludes = (arr, item) => {
    return Array.isArray(arr) ? arr.includes(item) : false;
};

/**
 * Safely get array slice
 * @param {any} arr - The potential array
 * @param {number} start - Start index
 * @param {number} end - End index
 * @returns {Array} - Sliced array or empty array
 */
export const safeSlice = (arr, start, end) => {
    return Array.isArray(arr) ? arr.slice(start, end) : [];
};

/**
 * Safely get first item from array
 * @param {any} arr - The potential array
 * @returns {any} - First item or undefined
 */
export const safeFirst = (arr) => {
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
};

/**
 * Safely get last item from array
 * @param {any} arr - The potential array
 * @returns {any} - Last item or undefined
 */
export const safeLast = (arr) => {
    return Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined;
};

/**
 * Safely check if array is empty
 * @param {any} arr - The potential array
 * @returns {boolean} - True if empty or not an array
 */
export const safeIsEmpty = (arr) => {
    return !Array.isArray(arr) || arr.length === 0;
};

/**
 * Safely concat arrays
 * @param {...any} arrays - Arrays to concatenate
 * @returns {Array} - Concatenated array
 */
export const safeConcat = (...arrays) => {
    return arrays.reduce((result, arr) => {
        if (Array.isArray(arr)) {
            return result.concat(arr);
        }
        return result;
    }, []);
};

/**
 * Safely sort an array (returns new array)
 * @param {any} arr - The potential array
 * @param {Function} compareFn - Optional compare function
 * @returns {Array} - Sorted array or empty array
 */
export const safeSort = (arr, compareFn) => {
    return Array.isArray(arr) ? [...arr].sort(compareFn) : [];
};

/**
 * Safely reduce an array
 * @param {any} arr - The potential array
 * @param {Function} reducer - The reducer function
 * @param {any} initialValue - Initial value
 * @returns {any} - Reduced value or initial value
 */
export const safeReduce = (arr, reducer, initialValue) => {
    return Array.isArray(arr) ? arr.reduce(reducer, initialValue) : initialValue;
};

/**
 * Create a safe array hook for React components
 * @param {any} value - The value that should be an array
 * @returns {Array} - Safe array
 */
export const useSafeArray = (value) => {
    return React.useMemo(() => safeArray(value), [value]);
};

// Export all utilities as default object
export default {
    safeLength,
    safeArray,
    safeFilter,
    safeMap,
    safeFind,
    safeIncludes,
    safeSlice,
    safeFirst,
    safeLast,
    safeIsEmpty,
    safeConcat,
    safeSort,
    safeReduce,
    useSafeArray
};