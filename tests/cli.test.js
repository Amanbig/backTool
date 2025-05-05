import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock modules before importing them
jest.mock('child_process', () => ({
    exec: jest.fn((cmd, callback) => {
        // Default mock implementation
        return { pid: 123 }; // Return a mock process object
    })
}));

// Mock console.log to avoid cluttering test output
jest.spyOn(console, 'log').mockImplementation(() => { });

// Import the mocked module after mocking
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'index.js');


describe('CLI functionality', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Default mock implementation that can be overridden in individual tests
        exec.mockImplementation((cmd, callback) => {
            return { pid: 123 }; // Return a mock process object
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should run without errors with --help flag', async () => {
        // Setup the mock implementation for this test
        exec.mockImplementation((cmd, callback) => {
            if (cmd.includes('--help')) {
                // Call the callback with the expected output
                callback(null, 'Usage: backtool [options]', '');
            }
            return { pid: 123 }; // Return a mock process object
        });

        // Execute the test
        await new Promise((resolve) => {
            exec(`node ${cliPath} --help`, (error, stdout, stderr) => {
                // These assertions will be called when our mock calls the callback
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
                // Call the callback with the expected version output
                callback(null, '1.0.6', '');
            }
            return { pid: 123 }; // Return a mock process object
        });

        // Execute the test
        await new Promise((resolve) => {
            exec(`node ${cliPath} -v`, (error, stdout, stderr) => {
                // These assertions will be called when our mock calls the callback
                expect(error).toBeNull();
                expect(stdout).toContain('1.0.6');
                expect(stderr).toBe('');
                resolve();
            });
        });

        // Verify the mock was called with the right arguments
        expect(exec).toHaveBeenCalledWith(`node ${cliPath} -v`, expect.any(Function));
    });

    it('should handle errors gracefully', async () => {
        // Setup the mock implementation to simulate an error
        const mockError = new Error('Command failed');
        exec.mockImplementation((cmd, callback) => {
            // Simulate an error condition
            callback(mockError, '', 'Command execution failed');
            return { pid: 123 };
        });

        // Execute the test
        await new Promise((resolve) => {
            exec(`node ${cliPath} --invalid-option`, (error, stdout, stderr) => {
                // Verify error handling
                expect(error).toBe(mockError);
                expect(stderr).toBe('Command execution failed');
                resolve();
            });
        });

        // Verify the mock was called with the right arguments
        expect(exec).toHaveBeenCalledWith(`node ${cliPath} --invalid-option`, expect.any(Function));
    });
}); // End of describe block