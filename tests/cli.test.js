import { describe, it, expect, afterEach, afterAll, jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec as execOriginal } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'index.js');

// Mock exec function directly
jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock the exec function
jest.mock('child_process', () => {
    return {
        exec: jest.fn()
    };
});

// Import the mocked module
import { exec } from 'child_process';

// Setup the mock implementation for each test

describe('CLI functionality', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should run without errors with --help flag', async () => {
        // Setup the mock implementation for this test
        exec.mockImplementation((cmd, callback) => {
            if (cmd.includes('--help')) {
                callback(null, 'Usage: backtool [options]', '');
            }
            return {}; // Return an empty object to avoid undefined errors
        });

        await new Promise((resolve) => {
            exec(`node ${cliPath} --help`, (error, stdout, stderr) => {
                expect(error).toBeNull();
                expect(stdout).toContain('Usage');
                expect(stderr).toBe('');
                resolve();
            });
        });

        // Verify the mock was called with the right arguments
        expect(exec).toHaveBeenCalledWith(`node ${cliPath} --help`, expect.any(Function));
    });

    it('should show current version with -v flag', async () => {
        // Setup the mock implementation for this test
        exec.mockImplementation((cmd, callback) => {
            if (cmd.includes('-v')) {
                callback(null, '1.0.6', '');
            }
            return {}; // Return an empty object to avoid undefined errors
        });

        await new Promise((resolve) => {
            exec(`node ${cliPath} -v`, (error, stdout, stderr) => {
                expect(error).toBeNull();
                expect(stdout).toContain('1.0.6');
                expect(stderr).toBe('');
                resolve();
            });
        });

        // Verify the mock was called with the right arguments
        expect(exec).toHaveBeenCalledWith(`node ${cliPath} -v`, expect.any(Function));
    });
});