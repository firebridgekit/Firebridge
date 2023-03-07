import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import { useCollection, useFirebridge } from '@firebridge/native'

type CollectionReference = FirebaseFirestoreTypes.CollectionReference
type Query = FirebaseFirestoreTypes.Query
type QuerySnapshot = FirebaseFirestoreTypes.QuerySnapshot

const useCollectionList = (
  getRef:
    | CollectionReference
    | Query
    | ((uid: string, ...pathParts: string[]) => CollectionReference | Query)
    | undefined,
  ids?: string[],
  pathParts: (string | undefined)[] = [],
) => {
  const { log } = useFirebridge()

  if (ids && ids.length > 10) {
    log.warn('More than 10 IDs provided. Only the first 10 will be used.')
  }

  if (ids && ids.length === 0) {
    console.warn('No IDs provided.')
  }

  const maxedIds = ids?.slice(0, 10)
  const idsHash =
    maxedIds && maxedIds.length > 0 ? maxedIds?.join(',') : undefined

  return useCollection(
    () =>
      getRef().where(
        firestore.FieldPath.documentId(),
        'in',
        maxedIds?.slice(0, 10),
      ),
    [...pathParts, idsHash],
  )
}
