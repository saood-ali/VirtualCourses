import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    // ✅ Allow CORS preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    let token;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // Check cookies (fallback)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "User doesn't have token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user =
      decoded.userId ||
      decoded.id ||
      decoded.userID ||
      decoded._id;

    if (!user) {
      return res.status(401).json({ message: "Invalid Token Payload" });
    }

    req.id = user;
    req.userId = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default isAuth;
