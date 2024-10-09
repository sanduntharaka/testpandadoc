import express, { json } from "express";
import cookieParser from "cookie-parser";
import { apiInstance } from "./api.js";
import {
  createDocumentFromPandadocTemplate,
  ensureDocumentCreated,
  documentSend,
} from "./utils.js";
import { odooService } from "./odoo.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(json());
app.use(cookieParser());

// Default endpoint
app.get("/", (req, res) =>
  res.status(200).send("Hello from Charlie-NodeJS-Pandadoc API!")
);

// Health check endpoint
app.get("/health", (req, res) => res.status(200).send("OK!"));

// Endpoint to create a document from a template ID
app.post("/create-document", async (req, res) => {
  const { taskId } = req.body || {};

  const sessionId = req.cookies.session_id; // Retrieve session ID from cookies

  if (!sessionId) {
    return res.status(401).send("Unauthorized: No session ID provided");
  }

  if (!taskId) {
    return res.status(400).send("Bad Request: No task ID provided");
  }

  try {
    const taskParams = {
      domain: [["id", "=", taskId]],
      model: "project.task",
    };

    const task = await odooService(taskParams, sessionId);

    if (!task) {
      return res.status(404).send("Task not found");
    }

    const {
      id,
      name,
      description,
      partner_id,
      company_id,
      partner_email,
      partner_city,
      partner_state,
    } = task?.records[0] || {};

    const empParams = {
      domain: [["task_id", "=", id]],
      model: "account.analytic.line",
    };

    const emp = await odooService(empParams, sessionId);

    const { employee_id, date } = emp?.records[0] || {};

    // Map task data to pdf
    const data = {
      templateId: "4XuGV2NXREbfZAN8i8PiS3",
      tokens: [
        {
          name: "date",
          value: date || "",
        },
        {
          name: "partner_company",
          value: company_id[1] || "",
        },
        {
          name: "employee_id",
          value: employee_id?.id || "",
        },
        {
          name: "partner_address",
          value: partner_email || "",
        },
        {
          name: "partner_city",
          value: partner_city || "",
        },
        {
          name: "partner_state",
          value: partner_state || "",
        },
        {
          name: "description",
          value: description || "",
        },
        {
          name: "name",
          value: name || "",
        },
      ],
      recipients: [
        {
          email: "laura.pessina@soluvia.io", // Update with client email -> partner_email
          first_name: "Laura",
          last_name: "Pessina",
          role: "Client", // Role must match the one in your template
          signingOrder: 1,
        },
      ],
      //   Others fields here...
    };

    console.log(data);

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
