import 'dotenv/config';
import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';
import { QRItem } from './models/QRItem.js';
import { Session } from './models/Session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');

// Read JSON file
const readJSONFile = (filePath) => {
    try {
        if (!existsSync(filePath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return [];
        }
        const data = readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

async function importData() {
    try {
        console.log('🔄 Starting data import...\n');

        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB\n');

        // Import Users
        console.log('📥 Importing users...');
        const usersData = readJSONFile(join(DATA_DIR, 'users.json'));

        if (usersData.length > 0) {
            // Clear existing users (optional - comment out if you want to keep existing data)
            // await User.deleteMany({});

            for (const userData of usersData) {
                const existingUser = await User.findOne({ email: userData.email });
                if (!existingUser) {
                    const user = new User({
                        _id: userData.id, // Use old ID if you want to maintain references
                        username: userData.username,
                        email: userData.email,
                        passwordHash: userData.passwordHash,
                        createdAt: userData.createdAt
                    });
                    await user.save();
                    console.log(`  ✅ Imported user: ${userData.username}`);
                } else {
                    console.log(`  ⏭️  User already exists: ${userData.username}`);
                }
            }
            console.log(`✅ Imported ${usersData.length} users\n`);
        } else {
            console.log('⚠️  No users to import\n');
        }

        // Import QR Items
        console.log('📥 Importing QR items...');
        const qrItemsData = readJSONFile(join(DATA_DIR, 'qr_items.json'));

        if (qrItemsData.length > 0) {
            // Clear existing items (optional)
            // await QRItem.deleteMany({});

            for (const itemData of qrItemsData) {
                const existingItem = await QRItem.findById(itemData.id);
                if (!existingItem) {
                    const item = new QRItem({
                        _id: itemData.id,
                        userId: itemData.userId,
                        title: itemData.title,
                        description: itemData.description || '',
                        imageId: itemData.imageId || '',
                        imageUrl: itemData.imageUrl || '',
                        isPublic: itemData.isPublic || false,
                        createdAt: itemData.createdAt,
                        updatedAt: itemData.updatedAt
                    });
                    await item.save();
                    console.log(`  ✅ Imported item: ${itemData.title}`);
                } else {
                    console.log(`  ⏭️  Item already exists: ${itemData.title}`);
                }
            }
            console.log(`✅ Imported ${qrItemsData.length} QR items\n`);
        } else {
            console.log('⚠️  No QR items to import\n');
        }

        // Import Sessions
        console.log('📥 Importing sessions...');
        const sessionsData = readJSONFile(join(DATA_DIR, 'sessions.json'));

        if (sessionsData && typeof sessionsData === 'object') {
            const sessionEntries = Object.entries(sessionsData);

            if (sessionEntries.length > 0) {
                try {
                    // Xóa hoàn toàn collection Session (bao gồm cả Index cũ bị lỗi)
                    await mongoose.connection.collection('sessions').drop();
                    console.log('  🗑️  Dropped old sessions collection and indexes.');
                } catch (error) {
                    // Nếu collection chưa tồn tại (lần chạy đầu tiên), bỏ qua lỗi này
                    if (error.code !== 26) {
                        console.log('  ⚠️ Warning dropping collection:', error.message);
                    }
                }
                // --------------------

                for (const [sessionId, userId] of sessionEntries) {
                    const session = new Session({
                        _id: sessionId,
                        userId: userId
                    });
                    await session.save();
                    console.log(`  ✅ Imported session for user: ${userId}`);
                }
                console.log(`✅ Imported ${sessionEntries.length} sessions\n`);
            } else {
                console.log('⚠️  No sessions to import\n');
            }
        }

        console.log('🎉 Data import completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   QR Items: ${await QRItem.countDocuments()}`);
        console.log(`   Sessions: ${await Session.countDocuments()}`);

    } catch (error) {
        console.error('❌ Import error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run import
importData();
