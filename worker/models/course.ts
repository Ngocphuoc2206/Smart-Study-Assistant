import {Schema, model, Document, Types} from "mongoose";

export interface ICourse extends Document{
    name: string;
    code?: string;
    description?: string;
    color?: string;
    teacher: Schema.Types.ObjectId;
    students: Schema.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

//Create schema
const courseSchema = new Schema<ICourse>({
    name: {
        type: String, 
        required: [true, "Course name is required"],  
        trim: true},
    code: {type: String, trim: true},
    description: {
        type: String,
        required: [true, "Course description is required"],
        maxlength: [1000, "Course description cannot be more than 1000 characters"],
        trim: true
    },
    color: {type: String, trim: true},
    teacher: {type: Schema.Types.ObjectId, ref: "User", required: false},
    students: [{type: Schema.Types.ObjectId, ref: "User", required: false}],
},
{
    timestamps: true
});

export const Course = model<ICourse>("Course", courseSchema);
