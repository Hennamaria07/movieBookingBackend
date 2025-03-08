import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import passport from "passport";
import session from "express-session";
import { configurePassport } from "./utils/passportUtils";

const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
    methods: ["GET", "HEAD", "OPTIONS", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
configurePassport();


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

export default app;
