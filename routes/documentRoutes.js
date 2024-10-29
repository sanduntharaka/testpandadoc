import express from "express";
import { createDocument } from "../controllers/documentController.js";

const router = express.Router();

// Create document route
router.post("/create-document", createDocument);

// Default route
router.get("/", (req, res) => res.status(200).send("Hello from NodeJS API!"));

export default router;
