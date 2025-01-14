import { Range } from "./types";
import crypto = require("crypto");

/**
 * Compares to range arrays to determine whether they are equal. Equal means that there is equa number of elements in
 * both array, and that each element in both arrays have same `from` and `to` values.
 * 
 * @param left Left range array to compare
 * @param right Right range array to compare
 * @returns Boolean indicating whether two range arrays cover the same numbers
 */
export function areRangesEqual(left: Range[], right: Range[]): boolean {
    if (left.length !== right.length) return false;

    for (let i = 0; i < left.length; i++) {
        if (left[i].from !== right[i].from || left[i].to !== right[i].to) return false;
    }

    return true;
}

/**
 * Finds the first available object ID from the array of ranges and array of consumed IDs.
 * 
 * @param ranges Array of ranges to search for the first available number
 * @param ids Array of already consumed object IDs
 * @returns Next available object ID, or 0 if all numbers are consumed
 */
export function findFirstAvailableId(ranges: Range[], ids: number[]): number {
    // No numbers consumed, return the first number from the first range
    if (!ids.length) return ranges[0].from;

    // Find the first unused number while minding performance
    let i = 0;
    for (let range of ranges) {
        for (let j = range.from; j <= range.to; j++) {
            if (i >= ids.length) return j;

            while (ids[i] < j) {
                if (++i >= ids.length) return j;
            }

            if (ids[i++] > j) return j;
        }
    }

    // All numbers from all ranges are consumed
    return 0;
}

/**
 * Calculates the SHA256 hash of specified content and returns it in specified encoding.
 * 
 * @param content Content to hash
 * @param encoding Encoding to use for output
 * @returns SHA256 hash of the content encoded as specified
 */
export function getSha256(content: string, encoding: "hex" | "base64") {
    const sha256 = crypto.createHash("sha256");
    sha256.update(content);
    return sha256.digest(encoding);
}
