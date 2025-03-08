import app from "./app";
import dotenv from "dotenv";
import dbConnect from "./config/db.config";

dotenv.config({ path: "./.env" });

dbConnect();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


