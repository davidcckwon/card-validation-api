import request from 'supertest';
import { app } from '../src/app';

describe('GET /health', () => {
  test('should return 200 with status ok', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok'
    });
  });
});
