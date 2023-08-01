import { firestore } from "firebase-admin";
import { chunk } from "lodash";

export interface FirestoreOperation {
  type: "set" | "update" | "merge";
  ref: FirebaseFirestore.DocumentReference;
  data?: any;
}

export const executeFirestoreBatch = async (batch: FirestoreOperation[]) => {
  const chunks = chunk(batch, 500);
  for (const chunk of chunks) {
    const batch = firestore().batch();
    chunk.forEach(({ type, ref, data }) => {
      switch (type) {
        case "set":
          return batch.set(ref, data);
        case "merge":
          return batch.set(ref, data, { merge: true });
        case "update":
          return batch.update(ref, data);
        default:
          throw new Error(`Unknown batch operation type: ${type}`);
      }
    });
    await batch.commit();
  }
};

export const executeFirestoreParallel = async (
  operations: FirestoreOperation[]
) =>
  Promise.all([
    ...operations.map(async ({ type, ref, data }) => {
      switch (type) {
        case "set":
          return ref.set(data);
        case "merge":
          return ref.set(data, { merge: true });
        case "update":
          return ref.update(data);
        default:
          throw new Error(`Unknown batch operation type: ${type}`);
      }
    }),
  ]);
