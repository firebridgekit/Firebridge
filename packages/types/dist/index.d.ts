type FirestoreTimestamp = {
    seconds: number;
    nanoseconds: number;
};
type SerializedFirestoreTimestamp = {
    seconds?: number;
    nanoseconds?: number;
    _seconds?: number;
    _nanoseconds?: number;
};

/**
 * @typedef Metadata
 * @description Represents the metadata of a Firestore document.
 * @property {string} [status] - The status of the document.
 * @property {FirestoreTimestamp} timeCreated - The time when the document was created.
 * @property {FirestoreTimestamp} [timeUpdated] - The time when the document was last updated.
 * @property {FirestoreTimestamp} [timeDeleted] - The time when the document was deleted.
 */
type EditorialMetadata<TS = FirestoreTimestamp> = {
    status?: 'draft' | 'published' | 'archived' | 'deleted';
    timeCreated: TS;
    timeUpdated?: TS;
    timeDeleted?: TS;
};
/**
 * @typedef WithEditorialMetadata
 * @template T - The type of the object.
 * @type {object}
 * @property {EditorialMetadata} _editorialMetadata - The metadata of the object.
 */
type WithEditorialMetadata<T, TS = FirestoreTimestamp> = T & {
    _editorialMetadata: EditorialMetadata<TS>;
};

/**
 * @typedef BaseErrorCode
 * @description Represents the base error codes that are common to all apps on the platform.
 * @type {string[]}
 */
type BaseErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
declare const baseErrorCodes: BaseErrorCode[];
/**
 * @typedef PlatformError
 * @description Represents an error that occurred on the platform.
 * @template C - The type of the error code.
 * @type {object}
 * @property {string} type - The type of the error.
 * @property {string} message - The message of the error.
 * @property {C} code - The code of the error.
 */
type PlatformError<C = BaseErrorCode> = {
    type: 'PlatformError';
    message: string;
    code: C;
    status: number;
    timestamp: string;
};

/**
 * @typedef PossiblyMissing
 * @template T - The type of the value.
 * @description Represents a value that may be missing (i.e., undefined or null).
 */
type PossiblyMissing<T> = T | undefined | null;

/**
 * @interface UserPermissions
 * @description Represents the permissions of a user.
 * @property {string | null} [role] - The role of the user. If the user does not have a role, this property can be null.
 * @property {Record<string, string>} [roles] - An object representing the roles of the user. The keys are the role names and the values are the role values.
 * @property {Object.<string, boolean>} [scopes] - An object representing the scopes of the user. The keys are the scope names and the values are booleans indicating whether the user has the scope.
 * @property {boolean} [isAdmin] - A boolean indicating whether the user is an admin.
 */
interface UserPermissions {
    role?: string | null;
    roles?: Record<string, string>;
    scopes?: {
        [scope: string]: boolean;
    };
    isAdmin?: boolean;
}

/**
 * @typedef WithId
 * @template T - The type of the object.
 * @type {object}
 * @property {string} id - The ID of the object.
 */
type WithId<T> = T & {
    id: string;
};

export { type BaseErrorCode, type EditorialMetadata, type FirestoreTimestamp, type PlatformError, type PossiblyMissing, type SerializedFirestoreTimestamp, type UserPermissions, type WithEditorialMetadata, type WithId, baseErrorCodes };
