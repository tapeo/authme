import { connect } from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is not defined");
    process.exit(1);
  }

  const env = process.env.ENV;

  let databaseName;
  if (env === "production") {
    databaseName = "prod";
  } else {
    databaseName = "test";
  }

  const uri = `${mongoUri}/${databaseName}?retryWrites=true&w=majority`;

  try {
    await connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
