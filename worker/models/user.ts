import {Schema, model, Document} from "mongoose";

export type UserRole = "student" | "teacher" | "admin";

export interface IUser extends Document{
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    role: UserRole;
}

//Create schema
const userSchema = new Schema<IUser>({
    firstName: {
        type: String,
        required: [true, "firstName is required"],
        trim: true,
        maxlength: [100, "firstName cannot be more than 100 characters"],
      },
    lastName: {
        type: String,
        required: [true, "lastName is required"],
        trim: true,
        maxlength: [100, "lastName cannot be more than 100 characters"],
    },
    email: {
        type: String, 
        required: [true, "Email is required"],  
        unique: true, 
        trim: true, 
        lowercase: true,
        validate: {
            validator: (value: string) => {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);
            },
            message: (props: {value: string}) => {
                return `${props.value} is not a valid email address`;
            }
        }
    },
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

export const User = model<IUser>("User", userSchema);
