import { Router } from "express";
import passport from "passport";
import upload from "../middlewares/middleware.multer";
import { 
  signup, 
  login, 
  forgotPassword, 
  resetPassword, 
  socialLoginCallback,
  verifySocialToken,
  updateUser,
  deleteUser
} from "../controllers/auth.controller";

const router = Router();

// Standard authentication routes
router.route("/signup").post(upload.single("avatar"), signup);
router.route("/login").post(login);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/verify-social-token").post(verifySocialToken as any);
router.route("/update/:id").patch(upload.single("avatar"), updateUser);
router.route('/delete/:id').delete(deleteUser);

// Google OAuth routes
router.get("/google", 
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback", 
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  socialLoginCallback("google")
);

// Facebook OAuth routes
router.get("/facebook", 
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get("/facebook/callback", 
  passport.authenticate("facebook", { session: false, failureRedirect: "/login" }),
  socialLoginCallback("facebook")
);

// Apple OAuth routes
router.get("/apple", 
  passport.authenticate("apple")
);

router.get("/apple/callback", 
  passport.authenticate("apple", { session: false, failureRedirect: "/login" }),
  socialLoginCallback("apple")
);


export default router;