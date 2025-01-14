/*
This file contains type declarations that are used by other files. All declarations that are used from more than
one file should be declared and exported from here.
*/

import { Context, HttpRequest } from "@azure/functions";
import { RequestValidator, ValidatorRule } from "../functions/v1/RequestValidator";
import { AppAuthorization } from "./AppAuthorization";

/**
 * Represents a range of object IDs configurable through `app.json` manifest file.
 */
export type Range = {
    from: number;
    to: number;
};

/**
 * Represents an array of object IDs.
 */
export type ObjectIds = {
    [key: string]: number[];
};

/**
 * Represents request body that includes the `appId` property. Provides static validation for body to check for
 * presence and type of this property.
 */
export class BodyWithAppId {
    appId: string;

    static get validateAppId(): ValidatorRule<BodyWithAppId>[] {
        return [
            RequestValidator.getPropertyPresenceValidationRule("appId"),
            RequestValidator.getPropertyTypeValidationRule("appId", "string")
        ]
    }
}

export interface FolderAuthorization {
    appId: string;
    authKey: string;
}

export class BodyWithAppFolders {
    appFolders: FolderAuthorization[];

    static get validateAppFolders(): ValidatorRule<BodyWithAppFolders>[] {
        return this.validateAppFoldersWithCustomProperties();
    }

    static validateAppFoldersWithCustomProperties(...customAllowed: string[]): ValidatorRule<BodyWithAppFolders>[] {
        return [
            RequestValidator.getPropertyIsArrayValidationRule("appFolders"),
            RequestValidator.getPropertyArrayMinLengthRule("appFolders", 1),
            {
                rule: (body) => {
                    for (let appFolder of body.appFolders) {
                        if (!appFolder.appId) return false;
                        for (let prop of Object.keys(appFolder)) {
                            if (prop !== "appId" && prop !== "authKey" && !customAllowed.includes(prop)) return false;
                        }
                    }
                    return true;
                },
                errorMessage: () => `Invalid "appFolders" specification. Each element must contain "appId" and optionally "authKey". ${customAllowed ? `Additional properties allowed are: ${customAllowed}.` : "No other properties are allowed."}`
            }
        ]
    }
}

export interface BodyWithAuthorization {
    authKey: string;
}

/**
 * Represents request body that includes the `type` property. Provides static validation for body to check for
 * presence and type of this property.
 */
export class BodyWithType {
    type: string;

    static get validateType(): ValidatorRule<BodyWithType>[] {
        return [
            RequestValidator.getPropertyPresenceValidationRule("type"),
            RequestValidator.getPropertyTypeValidationRule("type", "string"),
            {
                rule: ({ type }) => OBJECT_TYPES.includes(type.toLowerCase()),
                errorMessage: ({ type }) => `Invalid object type: ${type}`
            }
        ]
    }
}

const RANGE_VALIDATION_ERROR = {
    NOT_OBJECT: Symbol(),
    NOT_VALID: Symbol(),
    USES_ZERO: Symbol(),
    FROM_ABOVE_TO: Symbol(),
    OVERLAPPING: Symbol()
};

const INVALID_RANGES = "Invalid ranges specification: ";

/**
 * Represents request body that includes the `ranges` property. Provides static validation for body to check for
 * presence and type of this property.
 */
export class BodyWithRanges {
    ranges: Range[];

    static get validateRanges(): ValidatorRule<BodyWithRanges>[] {
        return [
            RequestValidator.getPropertyPresenceValidationRule("ranges"),
            RequestValidator.getPropertyIsArrayValidationRule("ranges"),
            RequestValidator.getPropertyArrayMinLengthRule("ranges", 1),
            {
                rule: ({ ranges }) => {
                    let last = 0;
                    ranges.sort((left, right) => left.from - right.from);
                    for (let range of ranges) {
                        if (!range || typeof range !== "object") return RANGE_VALIDATION_ERROR.NOT_OBJECT;
                        if (typeof range.from !== "number" || typeof range.to !== "number") return RANGE_VALIDATION_ERROR.NOT_VALID
                        if (range.from === 0 || range.to === 0) return RANGE_VALIDATION_ERROR.USES_ZERO;
                        if (range.to < range.from) return RANGE_VALIDATION_ERROR.FROM_ABOVE_TO;
                        if (range.from < last) return RANGE_VALIDATION_ERROR.OVERLAPPING;
                        last = range.to;
                    }
                    return true;
                },
                errorMessage: {
                    [RANGE_VALIDATION_ERROR.NOT_OBJECT]: `${INVALID_RANGES}array of objects expected`,
                    [RANGE_VALIDATION_ERROR.NOT_VALID]: `${INVALID_RANGES}each element must have "from" and "to" properties of type number`,
                    [RANGE_VALIDATION_ERROR.USES_ZERO]: `${INVALID_RANGES}"from" and "to" must not be 0`,
                    [RANGE_VALIDATION_ERROR.FROM_ABOVE_TO]: `${INVALID_RANGES}"from" must be higher than "to"`,
                    [RANGE_VALIDATION_ERROR.OVERLAPPING]: `${INVALID_RANGES}ranges must not be overlapping`
                }
            }
        ]
    }
}

export const OBJECT_IDS_VALIDATION_ERROR = {
    MISSING_IDS: Symbol("MISSING_IDS"),
    INVALID_IDS: Symbol("INVALID_IDS"),
    INVALID_TYPE: Symbol("INVALID_TYPE"),
    ARRAY_EXPECTED: Symbol("ARRAY_EXPECTED"),
};

export const INVALID_OBJECT_IDS = "Invalid object ids specification: ";

export class BodyWithObjectIds {
    ids: ObjectIds;

    static get validateObjectIds(): ValidatorRule<BodyWithObjectIds>[] {
        return [
            RequestValidator.getPropertyPresenceValidationRule("ids"),
            RequestValidator.getPropertyTypeValidationRule("ids", "object"),
            {
                rule: ({ ids }) => {
                    for (let type in ids) {
                        if (!OBJECT_TYPES.includes(type)) return OBJECT_IDS_VALIDATION_ERROR.INVALID_TYPE;
                        if (!Array.isArray(ids[type])) return OBJECT_IDS_VALIDATION_ERROR.ARRAY_EXPECTED;
                        for (let n of ids[type]) {
                            if (typeof n !== "number") return OBJECT_IDS_VALIDATION_ERROR.ARRAY_EXPECTED;
                        }
                    }
                    return true;
                },
                errorMessage: {
                    [OBJECT_IDS_VALIDATION_ERROR.INVALID_TYPE]: `${INVALID_OBJECT_IDS}invalid object type specified`,
                    [OBJECT_IDS_VALIDATION_ERROR.ARRAY_EXPECTED]: `${INVALID_OBJECT_IDS}array of number expected`,
                }
            }
        ];
    }
}

/**
 * Represents a `HttpRequest` request with specified strong-typed `body` property.
 * @template T Type to be assigned to the `body` property.
 */
export interface TypedRequest<T> extends HttpRequest {
    body: T;
}

/**
 * Represents a `Context` object with specified strong-typed bindings property.
 * @template T Type to be assigned to the `bindings` property.
 */
export interface TypedContext<T> extends Context {
    bindings: T;
}

export interface AuthorizationContext {
    bindings: {
        authorization: AppAuthorization;
    }
}

export interface PoolInfo {
    ownerApp: string;
    ranges: Range[];
    apps: string[];
}

export interface PoolReference {
    poolId: string;
}

export interface RejectionInfo {
    dateTime: string;
    ipAddress: string;
    appId: string;
    endpoint: string;
}

/**
 * Array of supported object types that require object ID numbering in AL.
 */
export const OBJECT_TYPES = [
    "codeunit",
    "enum",
    "enumextension",
    "page",
    "pageextension",
    "permissionset",
    "permissionsetextension",
    "query",
    "report",
    "reportextension",
    "table",
    "tableextension",
    "xmlport"
];

export const EVENT_LOG_ENTRY_TYPES = [
    "consumption",
    "sync",
    "authorization",
    "deauthorization"
];

export interface RequestBase {
    appId: string;
}