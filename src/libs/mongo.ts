import { connect } from "mongoose";

type DbOptions = {
  prodDbName?: string;
  testDbName?: string;
};

export const connectDB = async (options: DbOptions) => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is not defined");
    process.exit(1);
  }

  const env = process.env.ENV;

  let databaseName;
  if (env === "production") {
    databaseName = options.prodDbName || "prod";
  } else {
    databaseName = options.testDbName || "test";
  }

  const url = new URL(mongoUri);
  url.pathname = `/${databaseName}`;

  const uri = url.toString();

  try {
    await connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
