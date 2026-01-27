import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoute.js";
import cors from "cors";
import userRouter from "./routes/userRoute.js";
import courseRouter from "./routes/courseRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import reviewRouter from "./routes/reviewRoute.js";

dotenv.config({ quiet: true });

//Connect to DB immediately (so it works in Vercel)
connectDb(); 

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: [
        "http://localhost:5173", 
        "https://virtual-courses-euchqa2q8-adityasunnysingh1s-projects.vercel.app" //Vercel Frontend URL
    ],
    credentials: true
}));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/course", courseRouter);
app.use("/api/order", paymentRouter);
app.use("/api/review", reviewRouter);

app.get("/", (req, res) => {
    res.send("Hello from server");
});

const PORT = process.env.PORT || 3000;

// Only listen to port in Local Development
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app;