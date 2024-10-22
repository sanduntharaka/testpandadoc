/**
 * Create a document from a PandaDoc template
 * @param {Object} apiInstance - PandaDoc API instance
 * @param {Object} body - Document creation parameters
 * @returns {Promise<Object>} Created document response
 */
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

/**
 * Ensure that a document is successfully created by checking its status
 * @param {Object} apiInstance - PandaDoc API instance
 * @param {Object} document - Document to be checked
 * @returns {Promise<void>}
 */
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

/**
 * Send a document via PandaDoc
 * @param {Object} apiInstance - PandaDoc API instance
 * @param {Object} document - Document to be sent
 * @returns {Promise<void>}
 */
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
