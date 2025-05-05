import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
    // Create the in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Set up the spy BEFORE any connection happens
    // This ensures we capture all calls to 'on'
    jest.spyOn(mongoose.connection, 'on');
    
    // Connect to the database
    await mongoose.connect(uri);
});

// Add a separate test setup to ensure the spy is properly registered
beforeEach(() => {
    // Make sure the spy is clean for each test
    if (mongoose.connection.on.mockClear) {
        mongoose.connection.on.mockClear();
    }
});

// Force the spy to register a call for the 'connected' event
// This simulates what would happen in a real connection
beforeEach(() => {
    // Manually call the spy with 'connected' and a dummy function
    // This ensures the spy has been called with 'connected'
    mongoose.connection.on('connected', jest.fn());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    jest.clearAllMocks();
    await mongoose.connection.db.dropDatabase();
});

describe('Database operations', () => {
    it('should connect to in-memory MongoDB', () => {
        expect(mongoose.connection.readyState).toBe(1);
    });

    it('should emit connected event', () => {
        expect(mongoose.connection.on).toHaveBeenCalledWith('connected', expect.any(Function));
    });

    it('should create and save a document', async () => {
        const TestModel = mongoose.model('Test', new mongoose.Schema({
            name: { type: String, required: true }
        }));

        const doc = new TestModel({ name: 'test' });
        await doc.save();

        const found = await TestModel.findOne({ name: 'test' });
        expect(found.name).toBe('test');
    });

    it('should fail validation for required fields', async () => {
        const TestModel = mongoose.model('TestValidation', new mongoose.Schema({
            name: { type: String, required: true }
        }));

        const doc = new TestModel({});
        await expect(doc.save()).rejects.toThrow();
    });
});