const mockCallable = {
  data: { success: true },
}

const mockHttpsCallable = jest.fn().mockReturnValue(
  jest.fn().mockResolvedValue(mockCallable)
)

const mockFunctions = {
  httpsCallable: mockHttpsCallable,
}

module.exports = jest.fn(() => mockFunctions)