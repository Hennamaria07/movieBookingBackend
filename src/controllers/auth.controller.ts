import {Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User, { IUser } from "../models/user.model";
import uploadCloudinary from "../utils/uploadOnCloudinary";
import crypto from "crypto";
import { sendResetEmail } from "../utils/emailService";
import deleteImage from "../utils/destoryCloudinaryImage";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

interface SignupRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'theaterOwner' | 'user';
}

// Type for the request with file upload
interface SignupRequest extends Request {
  body: SignupRequestBody;
  file?: Express.Multer.File;
}

interface LoginRequestBody {
  identifier: string; // Can be either email or userId
  password: string;
}

interface LoginRequest extends Request {
  body: LoginRequestBody;
}

// **Signup Controller**
export const signup = async (req: any, res: Response): Promise<any> => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      userId,
      password, 
      phone, 
      role 
    } = req.body;
    const avatarFile = req.file;

    // Basic validation
    if (!firstName || !lastName || !email || !userId || !password) {
      res.status(400).json({ 
        message: "Missing required fields",
        required: ["firstName", "lastName", "email", "userId", "password"]
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
    if (existingUser) {
      res.status(400).json({ 
        message: "User already exists",
        field: existingUser.email === email ? "email" : "userId"
      });
      return;
    }

    // Handle avatar upload
    let avatar = { 
      publicId: "default_avatar", 
      url: "https://example.com/default-avatar.jpg" 
    };

    if (avatarFile) {
      try {
        const uploadResult = await uploadCloudinary(avatarFile.path, `avatars/${email}`);
        if (!uploadResult?.public_id || !uploadResult?.url) {
          throw new Error("Upload failed");
        }
        avatar = { 
          publicId: uploadResult.public_id, 
          url: uploadResult.url 
        };
      } catch (uploadError) {
        console.error("Avatar upload failed:", uploadError);
        // Continue with default avatar instead of failing the entire signup
      }
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      userId,
      password,
      phone,
      role: role || "user", // Default to "user" if not provided
      avatar,
      status: 'Active',
    });

    // Save user to database
    await newUser.save();

    // Prepare response data (excluding sensitive information)
    const responseUser = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      userId: newUser.userId,
      role: newUser.role,
      createdAt: newUser.createdAt,
      avatar: newUser.avatar,
      status: newUser.status
    };

    res.status(201).json({ 
      message: "User registered successfully",
      user: responseUser
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// **Login Controller**
export const login = async (req: any, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
const identifier = req.body.email
    // Input validation
    if (!identifier || !password) {
      res.status(400).json({
        message: "Missing required fields",
        required: ["identifier", "password"]
      });
      return;
    }

    // Check if identifier is email or userId format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(identifier);

    // Find user by either email or userId
    const user = await User.findOne({
      [isEmail ? 'email' : 'userId']: identifier
    }).select('+password'); // Explicitly select password since it's usually not selected by default

    if (!user) {
      res.status(401).json({ 
        message: "Invalid credentials",
        field: isEmail ? "email" : "userId"
      });
      return;
    }

    // Check user status
    if (user.status === 'Banned') {
      res.status(403).json({ 
        message: "Account is banned",
        status: user.status 
      });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const tokenPayload = {
      id: user._id,
      role: user.role,
      email: user.email,
      userId: user.userId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "7d",
      issuer: "movieBooking"
    });

    // Prepare user response data (excluding sensitive information)
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userId: user.userId,
      role: user.role,
      status: user.status,
      avatar: user.avatar.url
    };

    res.status(200).cookie("token", token, { httpOnly: true, secure: true }).json({
      message: "Login successful",
      token,
      user: userResponse
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// **Forgot Password Controller**
export const forgotPassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1-hour expiration
    await user.save();

    // Send reset email
    await sendResetEmail(user.email, resetToken);

    res.json({ message: "Password reset link sent to email" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// **Reset Password Controller**
export const resetPassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const user: IUser | null = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }, // Ensure token is not expired
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Social login callback handler
export const socialLoginCallback = (provider: string) => async (req: any, res: Response) => {
  try {
    // User should be attached by Passport
    const user = req.user as IUser;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/social-auth-callback?token=${token}`);
  } catch (error: any) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error.message)}`);
  }
};

// For handling social login token verification from the frontend
export const verifySocialToken = async (req: any, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.json({ message: "Token verification successful", user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }});
  } catch (error: any) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const updateUser = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.params.id;
    const { 
      firstName, 
      lastName, 
      email, 
      newPassword,
      phone, 
      role,
      status,
      bannedReason
    } = req.body;
    const avatarFile = req.file;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email already exists (if email is being updated)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Email format validation if changing email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
    }

    // Update basic user information
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if(bannedReason) user.bannedReason = bannedReason;

    // Only update password if newPassword is provided
    if (newPassword) {
      user.password = newPassword; // Assuming password hashing middleware is set up on the model
    }

    console.log('avtar filr', avatarFile)
    // Only update avatar if avatarFile is provided
    if (avatarFile) {
      try {
        // Delete previous avatar if it's not the default
        if (user.avatar.publicId && user.avatar.publicId !== "default_avatar") {
          await deleteImage(user.avatar.publicId);
        }

        // Upload new avatar
        const uploadResult = await uploadCloudinary(avatarFile.path, `avatars/${user.email}`);
        if (!uploadResult?.public_id || !uploadResult?.url) {
          throw new Error("Avatar upload failed");
        }

        user.avatar = {
          publicId: uploadResult.public_id,
          url: uploadResult.url
        };
        console.log(user.avatar )
      } catch (uploadError) {
        console.error("Avatar update failed:", uploadError);
        return res.status(400).json({ message: "Failed to update avatar" });
      }
    }

    // Save updated user
    await user.save();

    // Prepare response data (excluding sensitive information)
    const updatedUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userId: user.userId,
      phone: user.phone,
      role: user.role,
      status: user.status,
      updatedAt: user.updatedAt,
      avatar: user.avatar
    };

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user's avatar from Cloudinary if it exists and is not the default
    if (user.avatar && user.avatar.publicId && user.avatar.publicId !== "default_avatar") {
      try {
        await deleteImage(user.avatar.publicId);
      } catch (error) {
        console.error("Error deleting avatar from Cloudinary:", error);
        // Continue with user deletion even if avatar deletion fails
      }
    }

    // Delete the user from the database
    await User.findByIdAndDelete(userId);

    return res.status(200).json({ 
      message: "User deleted successfully",
      deletedUserId: userId
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};