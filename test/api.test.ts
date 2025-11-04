import request from 'supertest';
import { app } from '../src/index';

describe('API Endpoints', () => {
  describe('POST /validate', () => {
    test('should return 200 with valid card', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ number: '4111111111111111' })
        .expect(200);

      expect(response.body).toEqual({
        valid: true,
        scheme: 'visa',
        message: 'OK'
      });
    });

    test('should return 200 with valid card (spaces)', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ number: '4111 1111 1111 1111' })
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    test('should return 200 with valid card (dashes)', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ number: '4111-1111-1111-1111' })
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    test('should return 400 for invalid card number', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ number: '4111111111111112' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('invalid');
    });

    test('should return 400 for too short card number', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ number: '12345678901' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('12-19 digits');
    });

    test('should return 400 for too long card number', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ number: '12345678901234567890' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for missing number field', async () => {
      const response = await request(app)
        .post('/validate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for non-string number', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ number: 4111111111111111 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for empty string', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ number: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

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
});

