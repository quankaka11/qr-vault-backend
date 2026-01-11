import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { QRItem } from './models/QRItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOADS_DIR = join(__dirname, 'uploads');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImages() {
    try {
        console.log('☁️  Starting image upload to Cloudinary...\n');

        // Check if uploads directory exists
        if (!existsSync(UPLOADS_DIR)) {
            console.log('⚠️  No uploads directory found. Nothing to upload.');
            process.exit(0);
        }

        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB\n');

        // Get all files in uploads directory
        const files = readdirSync(UPLOADS_DIR);
        const imageFiles = files.filter(file => {
            const ext = file.toLowerCase().split('.').pop();
            return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        });

        if (imageFiles.length === 0) {
            console.log('⚠️  No images found in uploads directory.');
            await mongoose.connection.close();
            process.exit(0);
        }

        console.log(`📁 Found ${imageFiles.length} images to upload\n`);

        let uploadedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const filename of imageFiles) {
            try {
                const filePath = join(UPLOADS_DIR, filename);

                // Check if file is actually a file (not directory)
                const stats = statSync(filePath);
                if (!stats.isFile()) {
                    console.log(`  ⏭️  Skipping ${filename} (not a file)`);
                    skippedCount++;
                    continue;
                }

                console.log(`  📤 Uploading: ${filename}...`);

                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: 'qr-vault',
                    public_id: filename.split('.')[0], // Use original filename without extension
                    resource_type: 'image'
                });

                console.log(`  ✅ Uploaded: ${filename} → ${result.secure_url}`);

                // Update QR items that reference this image
                const itemsToUpdate = await QRItem.find({ imageId: filename });

                for (const item of itemsToUpdate) {
                    item.imageUrl = result.secure_url;
                    item.imageId = result.public_id;
                    await item.save();
                    console.log(`     🔄 Updated QR item: ${item.title}`);
                }

                uploadedCount++;

            } catch (error) {
                console.error(`  ❌ Error uploading ${filename}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n🎉 Image upload completed!');
        console.log('\n📊 Summary:');
        console.log(`   ✅ Uploaded: ${uploadedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);

    } catch (error) {
        console.error('❌ Upload error:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('\n👋 Disconnected from MongoDB');
        }
        process.exit(0);
    }
}

// Run upload
uploadImages();
