import { Schema, model, Document, Types } from 'mongoose';

export type ChatRole = 'user' | 'assistant';

export interface IChatMessage extends Document {
    user: Types.ObjectId;
    role: ChatRole;
    content: string;
    intent?: string;
    createdAt: Date;
    updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: [true, 'Role is required']
    },
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    intent: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);

