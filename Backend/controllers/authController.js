import User from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import generateToken from "../config/token.js";
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
        req.cookie("token",token,{
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
        req.cookie("token",token,{
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



