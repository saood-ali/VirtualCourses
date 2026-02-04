import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    let token;
    
    // Check Header (Best for avoiding "User doesn't have token" error)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    } 
    // Check Cookies (Fallback)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "User doesn't have token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if(!decoded){
    return res.status(401).json({message:"Invalid Token"});
    }
    const user = decoded.userId || decoded.id || decoded.userID || decoded._id;
    req.id = user;
    req.userId = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default isAuth;