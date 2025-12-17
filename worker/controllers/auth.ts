/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/user";
import { signAccessToken } from "../utils/jwt";
import { logDebug } from "../utils/logger";
import { AuthRequest } from "../middlewares/authMiddleware";
const SALT_ROUNDS = 10;

//POST /auth/register
export const register = async(req: Request, res: Response) => {
    try{
        // Guard in case body parser didn't populate req.body
        const body = req.body || {};
        if (!req.body) logDebug("Register called with empty body", req.headers || {});
        const {firstName, lastName, email, password} = body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }
        //Check existing User
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        //Hash Password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        //Create New User
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            passwordHash: passwordHash,
            role: body.role || "student"
        });

        // Assign token
        const accessToken = signAccessToken({ userId: newUser._id.toString(), role: newUser.role });
        logDebug("New user registered with data: ", newUser)
        return res.status(201).json({
            success: true,
            data: {
                user: {
                    id: newUser._id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    role: newUser.role
                },
                accessToken,
            }
        })
    }
    catch(error){
        logDebug("Error registering user: ", error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

//POST /auth/login
export const login = async(req: Request, res: Response) => {
    try{
        const {email, password} = req.body;
        //Check email and password is valid
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        const existingUser = await User.findOne({email});
        if (!existingUser){
            return res.status(401).json({
                success: false,
                message: "Invalid email"
            });
        }
        //Check password
        const isPasswordMatch = await bcrypt.compare(password, existingUser.passwordHash as string);
        if (!isPasswordMatch){
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }
        //Assign token
        const accessToken = signAccessToken({userId: existingUser._id.toString(), role: existingUser.role});
        // Set session user for cookie-based sessions
        try {
            (req as any).session.user = { userId: existingUser._id.toString() };
        } catch (e) {
            // ignore if session not configured
        }
        logDebug("User logged in with data: ", existingUser);
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: existingUser._id,
                    firstName: existingUser.firstName,
                    lastName: existingUser.lastName,
                    email: existingUser.email,
                    role: existingUser.role
                },
                accessToken
            }
        });
    }
    catch(error){
        logDebug("Error logging in user: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

//GET /auth/me
export const getMe = async(req: AuthRequest, res: Response) => {
    try{
        if (!req.user?.userId){
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        //Fetch user data
        const user = await User.findById(req.user.userId);
        if (!user){
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    }catch(error){
        logDebug("Error fetching user data: ", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
//PUT /auth/me
export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Check Authentication
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { firstName, lastName, avatarUrl } = req.body;

        // 2. prepare necessary data update 
        
        const updateData: any = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        // 3. Find và Update in Database
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            updateData,
            { new: true, runValidators: true }
        );

        // 4. Check user not found
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        logDebug("User updated profile: ", updatedUser);

        // 5. Return result
        return res.status(200).json({
            success: true,
            data: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                role: updatedUser.role,
                avatarUrl: updatedUser.avatarUrl
            }
        });

    } catch (error) {
        logDebug("Error updating user: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}