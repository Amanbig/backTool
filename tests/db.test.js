import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Database operations', () => {
    it('should connect to in-memory MongoDB', () => {
        expect(mongoose.connection.readyState).toBe(1);
    });

    it('should create and save a document', async () => {
        const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
        const doc = new TestModel({ name: 'test' });
        await doc.save();

        const found = await TestModel.findOne({ name: 'test' });
        expect(found.name).toBe('test');
    });
});