const mockDocumentSnapshot = {
  id: 'test-doc-id',
  exists: true,
  data: jest.fn().mockReturnValue({ name: 'Test Document' }),
}

const mockQuerySnapshot = {
  docs: [mockDocumentSnapshot],
}

const mockDocumentReference = {
  onSnapshot: jest.fn((onNext) => {
    onNext(mockDocumentSnapshot)
    return jest.fn() // unsubscribe function
  }),
  set: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
}

const mockCollectionReference = {
  onSnapshot: jest.fn((onNext) => {
    onNext(mockQuerySnapshot)
    return jest.fn() // unsubscribe function
  }),
  doc: jest.fn(() => mockDocumentReference),
}

const mockFirestore = {
  collection: jest.fn(() => mockCollectionReference),
  doc: jest.fn(() => mockDocumentReference),
}

module.exports = jest.fn(() => mockFirestore)