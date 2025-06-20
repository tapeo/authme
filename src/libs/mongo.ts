import { appConfig } from "..";

export const connectDB = async () => {
  if (!appConfig.mongoose.uri) {
    console.error("MONGO_URI is not defined");
    process.exit(1);
  }

  let databaseName;
  if (appConfig.env === "production") {
    databaseName = appConfig.mongoose.prod_db_name || "prod";
  } else {
    databaseName = appConfig.mongoose.test_db_name || "test";
  }

  const url = new URL(appConfig.mongoose.uri);
  url.pathname = `/${databaseName}`;

  if (appConfig.mongoose.directConnection) {
    url.searchParams.set("directConnection", appConfig.mongoose.directConnection.toString());
  }

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
