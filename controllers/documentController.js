import { getCurrentSession } from "../services/odooService.js";
import { createAndSendDocument } from "../services/pandadocService.js"; // Corrected import for service

import { uploadToS3, downloadFromS3, getSignatureURL } from "../services/s3Service.js";
import { odooService } from "../services/odooService.js";

export const createDocument = async (req, res, next) => {
    try {
        const { taskId } = req.body;
        const sessionId = req.cookies.session_id;

        if (!sessionId) return res.status(401).send("Unauthorized: No session ID provided!");
        if (!taskId) return res.status(400).send("Bad Request: No task ID provided!");
        if (!req.file) return res.status(400).send("Bad Request: Signature is missing!");

        const currentUser = await getCurrentSession({}, sessionId);
        if (!currentUser.uid) return res.status(401).send("Unauthorized: No user found!");

        // Fetch task details from Odoo
        const taskParams = {
            domain: [["id", "=", taskId]],
            model: "project.task",
        };
        const task = (await odooService(taskParams, sessionId)).records[0];
        if (!task) return res.status(404).send("Task not found");

        // Fetch additional data and upload signature to S3
        const s3Signature = await uploadToS3(req.file);
        const clientSignatureImagePath = await downloadFromS3(s3Signature.file_key, "clients");
        const operatorSignatureImagePath = await downloadFromS3(`operators/${currentUser.uid}.png`, "operators");

        const clientSignatureURL = getSignatureURL(clientSignatureImagePath.split("./")[1]);
        const OperatorSignatureURL = getSignatureURL(operatorSignatureImagePath.split("./")[1]);

        // Prepare document data
        console.log(clientSignatureURL)
        console.log(OperatorSignatureURL)

        const data = {
            templateId: "4XuGV2NXREbfZAN8i8PiS3",
            tokens: [
                { name: "date", value: task.date || "" },
                { name: "partner_id", value: task.partner_id || "" },
                {
                    name: "employee_id",
                    value: task.id || "",
                },
                {
                    name: "partner_address",
                    value: task.street || "",
                },
                {
                    name: "partner_city",
                    value: task.city || "",
                },
                {
                    name: "partner_state",
                    value: "normal",
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
            recipients: [
                {
                    email: "laura.pessina@soluvia.io",
                    first_name: "Laura",
                    last_name: "Pessina",
                    role: "Client",
                    signingOrder: 1,
                },
            ],
            images: [
                { name: "Client Signature", urls: [clientSignatureURL] },
                { name: "Operator Signature", urls: [OperatorSignatureURL] },
            ],
        };
  
        // Call the high-level service function to create and send the document
        const documentResponse = await createAndSendDocument(data);

        res.status(201).json({
            success: true,
            message: "Document created successfully!",
            data: documentResponse,
        });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};
