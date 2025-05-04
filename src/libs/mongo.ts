import { appConfig } from "..";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is not defined");
    process.exit(1);
  }

  const env = process.env.ENV;

  let databaseName;
  if (env === "production") {
    databaseName = appConfig.mongoose.prod_db_name || "prod";
  } else {
    databaseName = appConfig.mongoose.test_db_name || "test";
  }

  const url = new URL(mongoUri);
  url.pathname = `/${databaseName}`;

  const uri = url.toString();

  try {
    await appConfig.mongoose.instance.connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
