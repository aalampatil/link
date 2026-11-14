import express from "express";
import linkRouter from "./modules/link/link.routes.js";
import { publicRouter } from "./modules/link/link.public-routes.js";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import type { ErrorRequestHandler, Response } from "express";
import ApiError from "./utils/api-error.js";
import { env } from "./env.js";

function createApp() {
  const app = express();
  // app.set("trust proxy", 1);

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    env.CLIENT,
  ].filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    }),
  );
  // app.options("*", cors());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
      error: "Too many requests, please try again later.",
    },
    skip: (req) => req.method === "OPTIONS", // ⭐ IMPORTANT
    standardHeaders: true,
    legacyHeaders: false,
  });

  // console.log(limiter);
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(limiter);

  app.get("/", (_, res: Response) => {
    res.send("OK 200, check");
  });

  app.use("/api/link", publicRouter);

  app.use(clerkMiddleware());
  app.use("/api/link", linkRouter);
  // app.use("/api/user", userRouter);

  app.use((_, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ message: err.message });
      return;
    }

    const statusCode =
      typeof err?.statusCode === "number" ? err.statusCode : 500;
    const message =
      statusCode >= 500 ? "server error" : err?.message || "request failed";

    res.status(statusCode).json({ message });
  };

  app.use(errorHandler);

  return app;
}

export default createApp;
