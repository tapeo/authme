import { Mongoose } from "mongoose";

export type DbOptions = {
  prod_db_name?: string;
  test_db_name?: string;
  user_schema?: {
    pre?: (doc: Document) => Promise<void>;
    post?: (doc: Document) => Promise<void>;
  };
};

export const connectDB = async (
  mongooseInstance: Mongoose,
  options?: DbOptions
) => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is not defined");
    process.exit(1);
  }

  const env = process.env.ENV;

  let databaseName;
  if (env === "production") {
    databaseName = options?.prod_db_name || "prod";
  } else {
    databaseName = options?.test_db_name || "test";
  }

  const url = new URL(mongoUri);
  url.pathname = `/${databaseName}`;

  const uri = url.toString();

  try {
    await mongooseInstance!.connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
