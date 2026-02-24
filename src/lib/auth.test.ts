import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAuth, unauthorizedResponse } from './auth';

describe('checkAuth', () => {
  const validUsername = 'admin';
  const validPassword = 'supersecretpassword';

  beforeEach(() => {
    // Mock the environment variable
    vi.stubEnv('ADMIN_PASSWORD', validPassword);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return false if authorization header is missing', () => {
    const request = new Request('http://localhost');
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false if authorization header is not Basic', () => {
    const request = new Request('http://localhost', {
      headers: { 'Authorization': 'Bearer token' }
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false if credentials part is missing', () => {
     const request = new Request('http://localhost', {
      headers: { 'Authorization': 'Basic ' }
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false if credentials are not base64 encoded properly', () => {
     const request = new Request('http://localhost', {
      headers: { 'Authorization': 'Basic not-base64!' }
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false if username is incorrect', () => {
    const credentials = btoa(`wronguser:${validPassword}`);
    const request = new Request('http://localhost', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return false if password is incorrect', () => {
    const credentials = btoa(`${validUsername}:wrongpassword`);
    const request = new Request('http://localhost', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    expect(checkAuth(request)).toBe(false);
  });

  it('should return true if credentials are correct', () => {
    const credentials = btoa(`${validUsername}:${validPassword}`);
    const request = new Request('http://localhost', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    expect(checkAuth(request)).toBe(true);
  });
});

describe('unauthorizedResponse', () => {
  it('should return a 401 response with correct headers', () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="Admin API"');
    // Note: response.body usage might require async reading if we want to check content,
    // but verifying status and headers is sufficient.
  });
});
