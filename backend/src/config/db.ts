import mongoose from "mongoose";

const connectDb = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined in .env");
    }

    await mongoose.connect(mongoUri, {
      dbName: "HalistaChat",
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB successfully");
  } catch (error: any) {
    console.error("=================================================");
    console.error("❌ MongoDB Connection Failed:");
    if (
      error?.message?.includes("SSL alert number 80") ||
      error?.code === "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR"
    ) {
      console.error(
        "💡 CAUSE: MongoDB Atlas rejected the SSL handshake because your IP is not whitelisted."
      );
      console.error("👉 FIX: In MongoDB Atlas (cloud.mongodb.com):");
      console.error("   1. Go to 'Network Access' (under Security)");
      console.error("   2. Click 'Add IP Address' -> Select 'Allow Access from Anywhere' (0.0.0.0/0)");
      console.error("   3. Click Confirm and wait 30 seconds for Atlas to apply the firewall rule.");
    } else {
      console.error(error?.message || error);
    }
    console.error("=================================================");
  }
};

mongoose.connection.on("error", (err: any) => {
  if (err?.message?.includes("SSL alert number 80")) {
    console.error(
      "⚠️ MongoDB Atlas Network Access: Please whitelist 0.0.0.0/0 in your Atlas Dashboard."
    );
  } else {
    console.error("MongoDB runtime connection error:", err.message);
  }
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB connection disconnected");
});

export default connectDb;
