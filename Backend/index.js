import express from "express";
import dotenv from "dotenv";
import { createServer } from "http"; // Import HTTP Server
import { Server } from "socket.io";  
import connectDb from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoute.js";
import cors from "cors";
import userRouter from "./routes/userRoute.js";
import courseRouter from "./routes/courseRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import uploadRouter from "./routes/uploadRoute.js";
import { setupSocket } from "./config/socketHandler.js";
import liveclassRouter from "./routes/liveclassRoute.js";

dotenv.config({ quiet: true });

connectDb(); 

const app = express();
const httpServer = createServer(app); 

const allowedOrigins = [
  "http://localhost:5173", 
  "https://virtual-courses-frontend.vercel.app"
];

app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Expires", "Pragma"]     
}));

// Initialize Socket.io attached to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupSocket(io);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/course", courseRouter);
app.use("/api/order", paymentRouter);
app.use("/api/review", reviewRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/live", liveclassRouter);

app.get("/", (req, res) => {
    res.send("Server is running!");
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;