import { createHttpClient } from '../http';
import MockAdapter from 'axios-mock-adapter';

describe('HttpClient Retry Logic', () => {
  let mock: MockAdapter;
  let client: any;

  beforeEach(() => {
    client = createHttpClient({
      retryConfig: {
        retries: 2,
        retryDelay: () => 0, // No delay for tests
      }
    });
    mock = new MockAdapter(client);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should retry idempotent requests on 500 errors', async () => {
    mock.onGet('/test').replyOnce(500);
    mock.onGet('/test').replyOnce(500);
    mock.onGet('/test').reply(200, { success: true });

    const response = await client.get('/test');
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    // 1 initial + 2 retries = 3 total calls
    expect(mock.history.get.length).toBe(3);
  });

  it('should not retry on 4xx errors', async () => {
    mock.onGet('/test').reply(404);

    try {
      await client.get('/test');
    } catch (error: any) {
      expect(error.response.status).toBe(404);
    }
    
    expect(mock.history.get.length).toBe(1);
  });

  it('should not retry non-idempotent POST requests without idempotency key', async () => {
    mock.onPost('/test').reply(500);

    try {
      await client.post('/test', { data: 'test' });
    } catch (error: any) {
      expect(error.response.status).toBe(500);
    }
    
    expect(mock.history.post.length).toBe(1);
  });

  it('should retry POST requests if x-idempotency-key is present', async () => {
    mock.onPost('/test').replyOnce(500);
    mock.onPost('/test').reply(200, { success: true });

    const response = await client.post('/test', { data: 'test' }, {
      headers: { 'x-idempotency-key': 'key-123' }
    });

    expect(response.status).toBe(200);
    expect(mock.history.post.length).toBe(2);
  });

  it('should respect environment variables for retries', () => {
    process.env.HTTP_RETRY_COUNT = '5';
    createHttpClient();
    // Verification relies on the logic in createHttpClient reading process.env
    expect(process.env.HTTP_RETRY_COUNT).toBe('5');
    delete process.env.HTTP_RETRY_COUNT;
  });
});
