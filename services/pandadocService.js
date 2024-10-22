import { apiInstance } from './pandadocApiService.js';
import {
    createDocumentFromPandadocTemplate,
    ensureDocumentCreated,
    documentSend,
} from '../utils/pandadocUtils.js';

/**
 * High-level service to create and send a document via PandaDoc
 * @param {Object} data - The data to create the document (recipients, tokens, etc.)
 * @returns {Promise<Object>} Created document data
 */
export async function createAndSendDocument(data) {
    try {
        // Step 1: Create a document using the template
        const createdDocument = await createDocumentFromPandadocTemplate(apiInstance, data);
        
        // Step 2: Ensure the document is created and ready for sending
        await ensureDocumentCreated(apiInstance, createdDocument);
        
        // Step 3: Send the document
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
