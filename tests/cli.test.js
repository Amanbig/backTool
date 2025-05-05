import { describe, it, expect } from '@jest/globals';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'index.js');

describe('CLI functionality', () => {
    it('should run without errors with --help flag', (done) => {
        exec(`node ${cliPath} --help`, (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('Usage');
            expect(stderr).toBe('');
            done();
        });
    });

    it('should show version with -v flag', (done) => {
        exec(`node ${cliPath} -v`, (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('1.0.3');
            expect(stderr).toBe('');
            done();
        });
    });
});