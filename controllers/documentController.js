import { OdooService } from "../services/odoo/odooService.js";
import { createAndSendDocument } from "../services/pandadoc/pandadocService.js";
import { uploadToS3, downloadFromS3, getSignatureURL, getPresignedUrl } from "../services/s3/s3Service.js";

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
const UserModel = odoo.model('res.users');


export const createDocument = async (req, res, next) => {
    try {
        const { taskId } = req.body;

        if (!taskId) return res.status(400).send("Bad Request: No task ID provided!");
        if (!req.file) return res.status(400).send("Bad Request: Signature is missing!");

        await odoo.authenticate();
        // Fetch task details from Odoo using TaskModel
        // const task = await TaskModel.fetchTask(taskId);
        // console.log('h1')
        const taskIds = await TaskModel.search([['id', '=', taskId]]);
        if (taskIds.length === 0) return res.status(404).send("Task not found");
        const task = (await TaskModel.read(taskIds, ['name', 'description', 'partner_id']))[0];
        // console.log('h2')
        // Fetch employee data by task ID using EmployeeModel

        const empData = await EmployeeModel.searchRead([['task_id', '=', taskId]], ['date', 'id']);
        const emp = empData[0] || {};
        // console.log('h3')

        // Fetch partner data by partner ID from task data using PartnerModel
        const partner = (await PartnerModel.searchRead([['id', '=', task.partner_id[0]]], ['name', 'street', 'city', 'state_id']))[0];
        // console.log('h4')
        // Fetch current session user info
        const userIds = await UserModel.search([['id', '=', odoo.uid]]);
        if (userIds.length === 0) return res.status(401).send("Unauthorized: No user found!");
        const currentUser = (await UserModel.read(userIds, ['id', 'name', 'login']))[0];

        // console.log('h5:', currentUser)

        // Upload signature to S3 and retrieve URLs
        const s3Signature = await uploadToS3(req.file);

        // console.log('h6')
        // const clientSignatureImagePath = await downloadFromS3(s3Signature.file_key, "clients");
        // // console.log('h7')

        // const operatorSignatureImagePath = await downloadFromS3(`operators/${currentUser.id}.png`, "operators");
        // console.log('h8')

        // const clientSignatureURL = getSignatureURL(clientSignatureImagePath.split("./")[1]);
        // const OperatorSignatureURL = getSignatureURL(operatorSignatureImagePath.split("./")[1]);

        const clientSignatureURL = await getPresignedUrl(s3Signature.file_key);
        const operatorSignatureURL = await getPresignedUrl(`operators/${currentUser.id}.png`);
        // console.log('h9')
        console.log(clientSignatureURL, operatorSignatureURL)


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
                { name: "Firma addetto", urls: [operatorSignatureURL] },
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
