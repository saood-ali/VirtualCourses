import jwt from "jsonwebtoken";
const generateToken = async(userID)=>{
    try {
        const token = jwt.sign({userID}, process.env.JWT_SECRET,{expiresIn:"100d"});
        console.log(token);
    } catch (error) {
        console.log(error);
    }
}
export default generateToken;