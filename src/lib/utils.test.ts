import { describe, it, expect } from 'vitest';
import { escapeHtml } from './utils';

describe('escapeHtml', () => {
    it('should return the same string if no special characters are present', () => {
        const input = 'Hello World';
        expect(escapeHtml(input)).toBe(input);
    });

    it('should escape ampersands', () => {
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than signs', () => {
        expect(escapeHtml('3 < 5')).toBe('3 &lt; 5');
    });

    it('should escape greater than signs', () => {
        expect(escapeHtml('5 > 3')).toBe('5 &gt; 3');
    });

    it('should escape double quotes', () => {
        expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
    });

    it('should escape single quotes', () => {
        expect(escapeHtml("It's me")).toBe('It&#039;s me');
    });

    it('should escape mixed characters', () => {
        const input = '<script>alert("XSS")</script>';
        const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
        expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle empty strings', () => {
        expect(escapeHtml('')).toBe('');
    });

    it('should escape all occurrences of special characters', () => {
        const input = '<<>>&&""\'\'';
        const expected = '&lt;&lt;&gt;&gt;&amp;&amp;&quot;&quot;&#039;&#039;';
        expect(escapeHtml(input)).toBe(expected);
    });
});
