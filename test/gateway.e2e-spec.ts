import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ApiGatewayModule } from '../apps/api-gateway/src/api-gateway.module';

/**
 * End-to-end tests for the API Gateway.
 * Run with: npm run test:e2e
 */

describe('API Gateway (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiGatewayModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/products returns an array (public route)', async () => {
    const res = await request(app.getHttpServer()).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/orders rejects a request with no auth token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .send({ items: [{ productId: 'x', quantity: 1 }] });
    expect(res.status).toBe(401);
  });

  it('registers a user then logs in and receives a JWT', async () => {
    const email = `test-${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'password123', fullName: 'Test User' })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    expect(loginRes.body.accessToken).toBeDefined();
  });
});
