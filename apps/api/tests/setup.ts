// Unit tests use synthetic configuration and mock database calls where required.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'unit-test-only-not-a-deployed-secret-123456789';
process.env.DATABASE_URL = 'postgres://unit:unit@127.0.0.1:1/unit';
process.env.MOCK_AZURE = 'true';
process.env.WEB_ORIGIN = 'http://localhost:8080';
