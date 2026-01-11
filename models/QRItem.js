import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const qrItemSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: uuidv4
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    imageId: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt on save
qrItemSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export const QRItem = mongoose.model('QRItem', qrItemSchema);
