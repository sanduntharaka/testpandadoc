import { apiInstance } from './pandadocApiService.js';
import {
    createDocumentFromPandadocTemplate,
    ensureDocumentCreated,
    documentSend,
} from '../../utils/pandadocUtils.js';


export async function createAndSendDocument(data) {
    try {

        const createdDocument = await createDocumentFromPandadocTemplate(apiInstance, data);

        await ensureDocumentCreated(apiInstance, createdDocument);


        await documentSend(apiInstance, createdDocument);

        return {
            success: true,
            documentId: createdDocument.uuid,
            documentUrl: `https://app.pandadoc.com/a/#/documents/${createdDocument.uuid}`,
        };
    } catch (error) {
        throw new Error("Failed to create and send document: " + error.message);
    }
}
