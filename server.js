import dotenv from "dotenv";
// Initialize environment variables
dotenv.config();

import express, { json } from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import documentRoutes from "./routes/documentRoutes.js";
import errorHandler from "./middleware/errorHandler.js";


const app = express();
const port = process.env.PORT || 5000;


// Middleware to parse JSON requests
app.use(json());
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

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set the directory where your PDFs are stored
const uploadsDir = join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/", documentRoutes);

// Health check route
app.get("/health", (req, res) => res.status(200).send("OK!"));

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
