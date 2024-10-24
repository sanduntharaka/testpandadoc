import { callOdooMethod, getCurrentSession } from "../services/odoo/odooRpcService.js";
import { createAndSendDocument } from "../services/pandadoc/pandadocService.js";
import { uploadToS3, downloadFromS3, getSignatureURL } from "../services/s3/s3Service.js";

export const createDocument = async (req, res, next) => {
    try {
        const { taskId } = req.body;

        if (!taskId) return res.status(400).send("Bad Request: No task ID provided!");
        if (!req.file) return res.status(400).send("Bad Request: Signature is missing!");

        // Fetch task details from Odoo using RPC service
        const task = await callOdooMethod('project.task', 'search_read', [
            [['id', '=', taskId]], ['name', 'description', 'partner_id']
        ]);

        if (!task || task.length === 0) return res.status(404).send("Task not found");

        const emp = await callOdooMethod('account.analytic.line', 'search_read', [
            [['task_id', '=', task[0].id]], ['date', 'id']
        ]);

        const partner = await callOdooMethod('res.partner', 'search_read', [
            [['id', '=', task[0].partner_id[0]]], ['name', 'street', 'city', 'state_id']
        ]);


        const currentUser = await getCurrentSession({});
        if (!currentUser || !currentUser.uid) {
            return res.status(401).send("Unauthorized: No user found!");

        }

        // Upload signature to S3 and retrieve URLs
        const s3Signature = await uploadToS3(req.file);
        const clientSignatureImagePath = await downloadFromS3(s3Signature.file_key, "clients");

        const operatorSignatureImagePath = await downloadFromS3(`operators/${currentUser.uid}.png`, "operators");

        const clientSignatureURL = getSignatureURL(clientSignatureImagePath.split("./")[1]);
        const OperatorSignatureURL = getSignatureURL(operatorSignatureImagePath.split("./")[1]);

        // Prepare document data for PandaDoc
        const data = {
            templateId: "4XuGV2NXREbfZAN8i8PiS3",
            tokens: [
                {
                    name: "date",
                    value: emp[0].date || ""
                },
                {
                    name: "partner_id",
                    value: partner[0].name || ""
                },
                {
                    name: "employee_id",
                    value: emp[0].id || "",
                },
                {
                    name: "partner_address",
                    value: partner[0].street || "",
                },
                {
                    name: "partner_city",
                    value: partner[0].city || "",
                },
                {
                    name: "partner_state",
                    value: partner[0].state_id[1] || "",
                },
                {
                    name: "description",
                    value: task[0].description || "",
                },
                {
                    name: "name",
                    value: task[0].name || "",
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
                { name: "Firma cliente", urls: [clientSignatureURL] },
                { name: "Firma addetto", urls: [OperatorSignatureURL] },
            ],
        };

        // Call the PandaDoc service function to create and send the document
        const documentResponse = await createAndSendDocument(data);

        res.status(201).json({
            success: true,
            message: "Document created successfully!",
            data: documentResponse,
        });
    } catch (error) {
        next(error);
    }
};
