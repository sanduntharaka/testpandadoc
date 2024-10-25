import { OdooService } from "../services/odoo/odooService.js";
import { createAndSendDocument } from "../services/pandadoc/pandadocService.js";
import { uploadToS3, downloadFromS3, getSignatureURL } from "../services/s3/s3Service.js";

const odoo = new OdooService(
    process.env.ODOO_URL,
    process.env.ODOO_DB,
    process.env.ODOO_USERNAME,
    process.env.ODOO_PASSWORD
);

// Define instances for specific Odoo models
const TaskModel = odoo.model('project.task');
const EmployeeModel = odoo.model('account.analytic.line');
const PartnerModel = odoo.model('res.partner');
const userModel = odoo.model('');


export const createDocument = async (req, res, next) => {
    try {
        const { taskId } = req.body;

        if (!taskId) return res.status(400).send("Bad Request: No task ID provided!");
        if (!req.file) return res.status(400).send("Bad Request: Signature is missing!");

        // Fetch task details from Odoo using TaskModel
        const task = await TaskModel.fetchTask(taskId);

        if (!task || task.length === 0) return res.status(404).send("Task not found");

        // Fetch employee data by task ID using EmployeeModel
        const empData = await EmployeeModel.fetchEmployeeByTaskId(task.id);
        const emp = empData[0] || {};  // Assume first record or default to empty

        // Fetch partner data by partner ID from task data using PartnerModel
        const partner = await PartnerModel.fetchPartnerById(task.partner_id[0]);

        // Fetch current session user info
        const currentUser = await userModel.getUser();
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
                    value: emp.date || ""
                },
                {
                    name: "partner_id",
                    value: partner.name || ""
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
