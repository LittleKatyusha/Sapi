import HttpClient from './httpClient';
import YieldBaselineService from './yieldBaselineService';

jest.mock('./httpClient', () => ({ get: jest.fn() }));

test('preserves server read-only scope for branch baseline controls', async () => {
  HttpClient.get.mockResolvedValue({ data: [], read_only: true });
  expect((await YieldBaselineService.getData()).readOnly).toBe(true);
  HttpClient.get.mockResolvedValue({ data: [], read_only: false });
  expect((await YieldBaselineService.getData()).readOnly).toBe(false);
});
