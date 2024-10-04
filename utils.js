const MAX_CHECK_RETRIES = 5;
const TEMPLATE_ID = "4XuGV2NXREbfZAN8i8PiS3";

export async function createDocumentFromPandadocTemplate(apiInstance, body) {
    const documentCreateRequest = {
        name: "Test Document",
        templateUuid: TEMPLATE_ID, // Replace with your template UUID
        recipients: [{
            id: "Cn4TmScM3BXENieiRpZJAh",
            email: "laura.pessina@soluvia.io",
            first_name: "Laura",
            last_name: "Pessina",
            role: "Employee", // Role must match the one in your template
            signingOrder: 1,
        }, ],
        tokens: [{
                name: "date",
                value: "10.05.2024",
            },
            {
                name: "description",
                value: "test",
            },
            {
                name: "employee_id",
                value: "189",
            },
            {
                name: "name",
                value: "Sherin",
            },
            {
                name: "notes",
                value: "test",
            },
            {
                name: "partner_address",
                value: "test address",
            },
            {
                name: "partner_city",
                value: "Milan",
            },
            {
                name: "partner_company",
                value: "Innovis",
            },
            {
                name: "partner_state",
                value: "test",
            },
            {
                name: "project.task",
                value: "test",
            },
        ],
        fields: {},
        metadata: {},
        pricing: {},
        tags: [],
        content_placeholders: [],
        parseFormFields: true,
    };

    return await apiInstance.createDocument({
        documentCreateRequest,
    });
}

export async function ensureDocumentCreated(apiInstance, document) {
    // let status = document.status;

    let retries = 0;

    while (retries < MAX_CHECK_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000));
        retries++;

        let response = await apiInstance.statusDocument({
            id: String(document.id),
        });
        if (response.status === "document.draft") {
            return;
        }
    }

    throw Error("Document was not sent");
}

export async function documentSend(apiInstance, document) {
    await apiInstance.sendDocument({
        id: String(document.id),
        documentSendRequest: {
            silent: false,
            subject: "Field Service Report",
            message: "This is a testing report",
        },
    });
}