import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { matchesCronSecret } from '../src/lib/secrets.ts';

describe('Security: Constant-Time Secret Matching', () => {
	const ORIGINAL_ENV = process.env.CRON_SECRET;

	beforeEach(() => {
		process.env.CRON_SECRET = ORIGINAL_ENV;
	});

	test('should return false when CRON_SECRET is missing from environment', () => {
		delete process.env.CRON_SECRET;
		const req = new Request('https://tuweb.dev/api/cycle', {
			headers: { authorization: 'Bearer some-secret-token' },
		});
		assert.equal(matchesCronSecret(req), false);
	});

	test('should return true for valid Authorization header', () => {
		process.env.CRON_SECRET = 'secret-cron-key-12345';
		const req = new Request('https://tuweb.dev/api/cycle', {
			headers: { authorization: 'Bearer secret-cron-key-12345' },
		});
		assert.equal(matchesCronSecret(req), true);
	});

	test('should return false for invalid Authorization header secret', () => {
		process.env.CRON_SECRET = 'secret-cron-key-12345';
		const req = new Request('https://tuweb.dev/api/cycle', {
			headers: { authorization: 'Bearer wrong-cron-key-99999' },
		});
		assert.equal(matchesCronSecret(req), false);
	});

	test('should return false for headers with different lengths', () => {
		process.env.CRON_SECRET = 'secret-cron-key-12345';
		const reqShort = new Request('https://tuweb.dev/api/cycle', {
			headers: { authorization: 'Bearer x' },
		});
		const reqLong = new Request('https://tuweb.dev/api/cycle', {
			headers: { authorization: 'Bearer secret-cron-key-12345-extra-long' },
		});
		assert.equal(matchesCronSecret(reqShort), false);
		assert.equal(matchesCronSecret(reqLong), false);
	});

	test('should return false when Authorization header is missing', () => {
		process.env.CRON_SECRET = 'secret-cron-key-12345';
		const req = new Request('https://tuweb.dev/api/cycle');
		assert.equal(matchesCronSecret(req), false);
	});
});
