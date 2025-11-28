import {Schema, model, Document} from "mongoose";

export interface ICourse extends Document{
    name: String;
    code?: String;
    description?: String;
    color?: String;
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
    teacher: {type: Schema.Types.ObjectId, ref: "User", required: true},
    students: [{type: Schema.Types.ObjectId, ref: "User", required: true}],
},
{
    timestamps: true
});

export const Course = model<ICourse>("Course", courseSchema);
