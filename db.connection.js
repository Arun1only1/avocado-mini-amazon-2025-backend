import mongoose from "mongoose";

const dbName = "mini-amazon";
const dbUserName = "avocadoUser";
const dbPassword = encodeURIComponent("Avocado@123");
const dbHost = "school.b6qkdnb.mongodb.net";
const dbOptions = "retryWrites=true&w=majority&appName=School";

const connectDB = async () => {
  try {
    const url = `mongodb+srv://${dbUserName}:${dbPassword}@${dbHost}/${dbName}?${dbOptions}`;

    await mongoose.connect(url);

    console.log("DB connection established...");
  } catch (error) {
    console.log("DB connection failed...");
    console.log(error.message);
    process.exit(1);
  }
};

export default connectDB;
