import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeString, escapeHtml } from './utils.ts';

describe('Utility Functions', () => {
    describe('sanitizeString', () => {
        it('should return null for null input', () => {
            assert.strictEqual(sanitizeString(null), null);
        });

        it('should return null for undefined input', () => {
            assert.strictEqual(sanitizeString(undefined), null);
        });

        it('should return null for empty string', () => {
            assert.strictEqual(sanitizeString(''), null);
        });

        it('should return null for string with only whitespace', () => {
            assert.strictEqual(sanitizeString('   '), null);
            assert.strictEqual(sanitizeString('\t\n'), null);
        });

        it('should trim whitespace from valid strings', () => {
            assert.strictEqual(sanitizeString('  hello  '), 'hello');
            assert.strictEqual(sanitizeString('\tworld\n'), 'world');
        });

        it('should remove zero-width spaces', () => {
            // \u200B is zero-width space
            assert.strictEqual(sanitizeString('hello\u200Bworld'), 'helloworld');
            assert.strictEqual(sanitizeString('\u200B'), null);
        });

        it('should remove other invisible characters', () => {
            // \uFEFF is zero-width no-break space
            assert.strictEqual(sanitizeString('foo\uFEFFbar'), 'foobar');
            // \u200C - \u200F are zero-width joiners/non-joiners etc
            assert.strictEqual(sanitizeString('a\u200Cb\u200Dc\u200Ed\u200Fe'), 'abcde');
        });

        it('should handle combination of whitespace and invisible characters', () => {
            assert.strictEqual(sanitizeString('  \u200B  '), null);
            assert.strictEqual(sanitizeString('  foo \u200B bar  '), 'foo  bar');
        });

        it('should preserve regular characters and spaces', () => {
            const input = 'Normal Text 123 !@#';
            assert.strictEqual(sanitizeString(input), input);
        });
    });

    describe('escapeHtml', () => {
        it('should escape & (ampersand)', () => {
            assert.strictEqual(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
        });

        it('should escape < (less than)', () => {
            assert.strictEqual(escapeHtml('1 < 2'), '1 &lt; 2');
        });

        it('should escape > (greater than)', () => {
            assert.strictEqual(escapeHtml('2 > 1'), '2 &gt; 1');
        });

        it('should escape " (double quote)', () => {
            assert.strictEqual(escapeHtml('He said "Hello"'), 'He said &quot;Hello&quot;');
        });

        it('should escape \' (single quote)', () => {
            assert.strictEqual(escapeHtml("It's me"), "It&#039;s me");
        });

        it('should escape potential script tags', () => {
            const input = '<script>alert("xss")</script>';
            const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
            assert.strictEqual(escapeHtml(input), expected);
        });

        it('should handle strings with no special characters', () => {
            assert.strictEqual(escapeHtml('Hello World'), 'Hello World');
        });

        it('should handle empty string', () => {
            // Assuming escapeHtml handles empty string by just returning it or crashing depending on implementation
            // The implementation calls replace on the input string, so it should work on empty string as long as replace works.
            assert.strictEqual(escapeHtml(''), '');
        });
    });
});
