export const Client = jest.fn().mockImplementation(() => ({
  bind: jest.fn().mockResolvedValue(undefined),
  unbind: jest.fn().mockResolvedValue(undefined),
  search: jest.fn(),
  modify: jest.fn(),
}))
