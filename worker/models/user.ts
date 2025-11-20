import {Schema, model, Document} from "mongoose";

export type UserRole = "student" | "teacher" | "admin";

export interface IUser extends Document{
    fullName: String;
    email: String;
    passwordHash: String;
    avatarUrl?: String;
    createdAt: Date;
    updatedAt: Date;
    role: UserRole;
}

//Create schema
const UserSchema = new Schema<IUser>({
    fullName: {type: String, required: true, trim: true},
    email: {type: String, required: true, unique: true, trim: true, lowercase: true},
    passwordHash: {type: String, required: true},
    avatarUrl: String,
    role: {
        type: String,
        enum: ["student", "teacher", "admin"],
        default: "student",
    },
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
});

export const User = model<IUser>("User", UserSchema);
