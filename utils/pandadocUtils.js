export async function createDocumentFromPandadocTemplate(apiInstance, body) {
    const { tokens, recipients, templateId, images } = body;
    const documentCreateRequest = {
        name: "Field Service Report",
        templateUuid: templateId,
        recipients,
        tokens,
        images,
    };

    return await apiInstance.createDocument({
        documentCreateRequest,
    });
}

export async function ensureDocumentCreated(apiInstance, document) {
    const MAX_CHECK_RETRIES = 5;
    const RETRY_INTERVAL_MS = 2000;

    let retries = 0;
    while (retries < MAX_CHECK_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
        retries++;

        const response = await apiInstance.statusDocument({
            id: String(document.id),
        });

        if (response.status === "document.draft") {
            return;
        }
    }

    throw new Error("Document was not sent after multiple retries");
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
