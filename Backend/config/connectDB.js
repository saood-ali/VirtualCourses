import mongoose from "mongoose";

const connectDb = async () => {
    try {
        // 👇 ADD THIS: "const connectionInstance ="
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`);
        
        // Now this line will work because the variable exists
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDB connection error", error);
        process.exit(1);
    }
}

export default connectDb;