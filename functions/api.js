// const dotenv = require("dotenv");
import dotenv from "dotenv";
// Initialize environment variables
dotenv.config();

// const express = require("express");
// const cookieParser = require("cookie-parser");
// const multer = require("multer");
// const path = require("path");

import express from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";

// const documentRoutes = require("../routes/documentRoutes.js");
// const errorHandler = require("../middleware/errorHandler.js");

import documentRoutes from "../routes/documentRoutes.js";
import errorHandler from "../middleware/errorHandler.js";
const serverless = require("serverless-http");


const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(cookieParser());

// File uploading middleware
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(upload.single("file"));

// Set the directory where your PDFs are stored
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api", documentRoutes);

// Health check route
app.get("/health", (req, res) => res.status(200).send("OK!"));

// Error handling middleware
app.use(errorHandler);

export const handler = serverless(app);

// Start the server (if you need this for local testing; can be removed for Netlify deployment)
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
