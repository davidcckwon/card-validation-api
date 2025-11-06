import request from 'supertest';
import { app } from '../src/app';

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

  test('should return 400 for invalid Luhn checksum', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '4111111111111112' })
      .expect(400);

    expect(response.body).toHaveProperty('valid');
    expect(response.body.valid).toBe(false);
    expect(response.body.message).toContain('Luhn');
  });

  test('should return 400 for too short card number', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '12345678901' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
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
    expect(response.body.error).toContain('string field');
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

  test('should return 400 for non-digits', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '4111-1111-1111-abcd' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('should accept 12-digit card (minimum length)', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '222100000009' })
      .expect(200);

    expect(response.body.valid).toBe(true);
  });

  test('should accept 19-digit card (maximum length)', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '6011000990139424249' })
      .expect(200);

    expect(response.body.valid).toBe(true);
  });
});

describe('Card Scheme Detection', () => {
  test('should detect Visa', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '4111111111111111' })
      .expect(200);

    expect(response.body.scheme).toBe('visa');
  });

  test('should detect Mastercard (51-55)', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '5500000000000004' })
      .expect(200);

    expect(response.body.scheme).toBe('mastercard');
  });

  test('should detect Mastercard (2221-2720)', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '2221000000000009' })
      .expect(200);

    expect(response.body.scheme).toBe('mastercard');
  });

  test('should detect Amex', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '340000000000009' })
      .expect(200);

    expect(response.body.scheme).toBe('amex');
  });

  test('should detect Discover', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ number: '6011111111111117' })
      .expect(200);

    expect(response.body.scheme).toBe('discover');
  });
});

