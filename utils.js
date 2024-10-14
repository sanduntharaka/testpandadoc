const MAX_CHECK_RETRIES = 5;

export async function createDocumentFromPandadocTemplate(apiInstance, body) {
    const { tokens, recipients, templateId, images } = body;
    const documentCreateRequest = {
        name: "Field Service Report",
        templateUuid: templateId, // Replace with your template UUID
        recipients,
        tokens,
        images,
        fields: {},
        metadata: {},
        pricing: {},
        tags: [],
        content_placeholders: [],
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