import User from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import generateToken from "../config/token.js";
import otpGenerator from "otp-generator";
import sendMail from "../config/sendMail.js";
export const signUp = async(req,res)=>{
    try {
        const {name, email, password, role} = req.body;
        let existUser = await User.findOne({email});
        if(existUser){
            return res.status(400).json({message:"User already exists"})
        }
        if(!validator.isEmail(email)){
            return res.status(400).json({message:"Invalid email"})
        }
        if(password.length<8){
            return res.status(400).json({message:"Password must be at least 8 characters long"})
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
        })
        let token = await generateToken(user._id);
        res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"strict",
            maxAge:1000*60*60*24*7,
        })
        return res.status(201).json(user)
    } catch (error) {
        return res.status(500).json({message:`SignUp Error ${error.message}`})
    }
};

export const login = async(req,res)=>{
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email})
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        const isPasswordMatched = await bcrypt.compare(password,user.password);
        if(!isPasswordMatched){
            return res.status(400).json({message:"Invalid password"})
        }
        let token = await generateToken(user._id);
        res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"strict",
            maxAge:1000*60*60*24*7,
        })
        return res.status(200).json(user)
        
    } catch (error) {
        return res.status(500).json({message:`Login Error ${error.message}`})
    }
};

export const logout = async(req,res)=>{
    try {
        await res.clearCookie("token");
        return res.status(200).json({message:"Logout successful"})
    } catch (error) {
        return res.status(500).json({message:`Logout Error ${error.message}`})
    }

};

export const sendOTP = async(req,res)=>{
    try {
        const {email} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        const otp = otpGenerator.generate(4, { 
        lowerCaseAlphabets: false, 
        upperCaseAlphabets: false, 
        specialChars: false 
        }).toString();
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 5*60*1000;
        user.isOtpVerified = false;
        await user.save();
        await sendMail(email,otp);
        return res.status(200).json({message:"OTP send successfully"});
    } catch (error) {
        return res.status(500).json({message:`Send otp error ${error.message}`})
    }
}

export const verifyOTP = async (req,res) => {
   try {
    const {email,otp} = req.body;
    const user = await User.findOne({email});
    if(!user || user.resetOtp !=otp || user.otpExpires < Date.now()){
        return res.status(404).json({message:"Invalid OTP"})
    }
    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return res.status(200).json({message:"OTP verified successfully"})
   } catch (error) {
     return res.status(500).json({message:`Verify otp error ${error.message}`})
   }
}

export const resetPassword = async (req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user || !user.isOtpVerified){
            return res.status(404).json({message:"OTP verification is required"})
        }
        const hashPassword = await bcrypt.hash(password,10);
        user.password = hashPassword;
        user.isOtpVerified = false;
        await user.save();
        return res.status(200).json({message:"Password reset successfully"})
    } catch (error) {
        return res.status(500).json({message:`Reset password error ${error.message}`})
    }
}