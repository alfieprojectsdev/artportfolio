import { describe, it, expect } from 'vitest';
import { checkAuth, unauthorizedResponse } from './auth';

describe('checkAuth', () => {
  it('should return false when Authorization header is missing', () => {
    const request = new Request('http://localhost');
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false when Authorization type is not Basic', () => {
    const request = new Request('http://localhost', {
      headers: { Authorization: 'Bearer token123' },
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false when credentials are missing', () => {
    const request = new Request('http://localhost', {
      headers: { Authorization: 'Basic ' },
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false when credentials are not base64 encoded correctly', () => {
    const request = new Request('http://localhost', {
      headers: { Authorization: 'Basic invalid-base64' },
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false when username is incorrect', () => {
    const credentials = btoa('user:secret-password');
    const request = new Request('http://localhost', {
      headers: { Authorization: `Basic ${credentials}` },
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false when password is incorrect', () => {
    const credentials = btoa('admin:wrong-password');
    const request = new Request('http://localhost', {
      headers: { Authorization: `Basic ${credentials}` },
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return true when credentials are correct', () => {
    // configured in vitest.config.ts
    const credentials = btoa('admin:secret-password');
    const request = new Request('http://localhost', {
      headers: { Authorization: `Basic ${credentials}` },
    });
    expect(checkAuth(request)).toBe(true);
  });
});

describe('unauthorizedResponse', () => {
  it('should return a 401 response with WWW-Authenticate header', () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="Admin API"');
  });
});
