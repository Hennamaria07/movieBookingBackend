import multer from "multer";
import { Request } from "express";

const storage = multer.diskStorage({
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

export default upload;
