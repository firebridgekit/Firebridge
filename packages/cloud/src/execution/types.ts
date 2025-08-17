/**
 * @interface FirestoreOperation
 * @description Represents an operation that can be performed on a Firestore document.
 * @property {('set' | 'update' | 'merge')} type - The type of operation to perform. This can be 'set', 'update', or 'merge'.
 * @property {FirebaseFirestore.DocumentReference} ref - A reference to the document to perform the operation on.
 * @property {any} [data] - The data to use for the operation. This is optional because some operations (like delete) may not require data.
 */
export interface FirestoreOperation {
  type: 'set' | 'update' | 'merge'
  ref: FirebaseFirestore.DocumentReference
  data?: any
}
