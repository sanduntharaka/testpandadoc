import express, { json } from "express";
import { apiInstance } from "./api.js";
import {
    createDocumentFromPandadocTemplate,
    ensureDocumentCreated,
    documentSend,
} from "./utils.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(json());

// Default endpoint
app.get("/", (req, res) => res.status(200).send("Hello from Pandadoc API!"));

// Health check endpoint
app.get("/health", (req, res) => res.status(200).send("OK!"));

// Endpoint to create a document from a template ID
app.post("/create-document", async(req, res) => {
    const customFields = req.body || {};

    try {
        let createdDocument = await createDocumentFromPandadocTemplate(
            apiInstance,
            customFields
        );
        console.log("Created document:", createdDocument);

        await ensureDocumentCreated(apiInstance, createdDocument);
        await documentSend(apiInstance, createdDocument);

        res.status(201).json({
            success: true,
            message: "Document created successfully!",
            data: {
                documentId: createdDocument.uuid,
                documentName: createdDocument.name,
                documentStatus: createdDocument.status,
                documentUrl: `https://app.pandadoc.com/a/#/documents/${createdDocument.uuid}`,
            },
        });
    } catch (error) {
        console.error("Error creating document:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to create document!" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});