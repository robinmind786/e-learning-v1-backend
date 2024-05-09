import mongoose, { Connection, ConnectOptions } from "mongoose";

interface CustomConnectOptions extends ConnectOptions {
  useNewUrlParser?: boolean;
  useUnifiedTopology?: boolean;
}

export const connectDB = async (
  dbUrl: string,
  options?: CustomConnectOptions
): Promise<Connection> => {
  try {
    const connection = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...options,
    });
    console.log(`Database connection with ${connection.connection.host}`);
    return connection.connection;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};
