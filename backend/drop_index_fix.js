require('dotenv').config();
const mongoose = require('mongoose');

const dropIndex = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('teams');

        console.log('Fetching indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        const indexName = 'inviteCode_1';
        const indexExists = indexes.find(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`Found obsolete index: ${indexName}. Dropping it...`);
            await collection.dropIndex(indexName);
            console.log('✅ Index dropped successfully!');
        } else {
            console.log('ℹ️ Index not found. It might have already been removed.');
        }

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropIndex();
