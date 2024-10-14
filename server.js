import express, { json } from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { apiInstance } from "./api.js";
import {
    createDocumentFromPandadocTemplate,
    ensureDocumentCreated,
    documentSend,
} from "./utils.js";
import { odooService } from "./odoo.js";
import { uploadToS3, downloadFromS3, getSignatureURL } from "./s3/s3.js";

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

// Get the current directory name
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

// Set the directory where your PDFs are stored
const documentsDir = join(__dirname, "documents"); // Adjust path if necessary

console.log(documentsDir);

// Serve static files from the documents directory
app.use("/documents", express.static(documentsDir));

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// Default endpoint
app.get("/", (req, res) =>
    res.status(200).send("Hello from Charlie-NodeJS-Pandadoc API!")
);

// Health check endpoint
app.get("/health", (req, res) => res.status(200).send("OK!"));

// Endpoint to create a document from a template ID
app.post("/create-document", upload.single("file"), async(req, res) => {
    const { taskId } = req.body || {};

    const sessionId = req.cookies.session_id; // Retrieve session ID from cookies

    if (!sessionId) {
        return res.status(401).send("Unauthorized: No session ID provided!");
    }

    if (!taskId) {
        return res.status(400).send("Bad Request: No task ID provided!");
    }

    const file = req.file;
    if (!file) {
        return res.status(400).send("Bad Request: Signature is missing!.");
    }

    try {
        const taskParams = {
            domain: [
                ["id", "=", taskId]
            ],
            model: "project.task",
        };

        const task = (await odooService(taskParams, sessionId)).records[0] || {};

        if (!task) {
            return res.status(404).send("Task not found");
        }

        const empParams = {
            domain: [
                ["task_id", "=", task.id]
            ],
            model: "account.analytic.line",
        };

        const emp = (await odooService(empParams, sessionId)).records[0] || {};

        const partnerParams = {
            domain: [
                ["id", "=", task.partner_id[0]]
            ],
            model: "res.partner",
        };

        const partner =
            (await odooService(partnerParams, sessionId)).records[0] || {};

        // Upload signature to S3
        const s3Signature = await uploadToS3(file);
        const signatureImagePath = await downloadFromS3(s3Signature.file_key);

        const clientSignatureURL = getSignatureURL(
            signatureImagePath.split("./")[1]
        );

        // Map task data to pdf
        const data = {
            templateId: "4XuGV2NXREbfZAN8i8PiS3",
            tokens: [{
                    name: "date",
                    value: emp.date || "",
                },
                {
                    name: "partner_id",
                    value: partner.name || "",
                },
                {
                    name: "employee_id",
                    value: emp.id || "",
                },
                {
                    name: "partner_address",
                    value: partner.street || "",
                },
                {
                    name: "partner_city",
                    value: partner.city || "",
                },
                {
                    name: "partner_state",
                    value: partner.state_id[1] || "",
                },
                {
                    name: "description",
                    value: task.description || "",
                },
                {
                    name: "name",
                    value: task.name || "",
                },
            ],
            recipients: [{
                email: "laura.pessina@soluvia.io", // Update with client email -> partner_email
                first_name: "Laura",
                last_name: "Pessina",
                role: "Client", // Role must match the one in your template
                signingOrder: 1,
            }, ],
            images: [{
                    name: "Firma cliente",
                    urls: [clientSignatureURL],
                },
                // {
                //     name: "Firma addetto",
                //     urls: [],
                // },
            ],
            //   Others fields here...
        };

        let createdDocument = await createDocumentFromPandadocTemplate(
            apiInstance,
            data
        );

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