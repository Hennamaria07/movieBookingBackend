import mongoose from "mongoose";
import { databaseName } from "../utils/constants";
import dotenv from 'dotenv';

dotenv.config();

const DB_URL: string | undefined = process.env.DATABASE_CONNECTION_URL;

const dbConnect = async () => {
   mongoose.connect(`${DB_URL}/${databaseName}`)
   .then((res) => {
    console.log(`DATABASE CONNECTED SUCCESSFULLY WITH ${res.connection.host}`);
   })
   .catch((err) => {
    console.log(`DATABASE CONNECTION ERROR--->${err.message}`);
   })
}

export default dbConnect;
