import * as pd_api from "pandadoc-node-client";
import dotenv from "dotenv";
dotenv.config();

// Load PandaDoc API key and base URL from environment variables
const API_KEY = process.env.PANDADOC_API_KEY;
const BASE_URL = process.env.PANDADOC_BASE_URL || "https://api.pandadoc.com";

// Throw error if API key is not defined
if (!API_KEY) {
    throw new Error("PANDADOC_API_KEY is not defined in the environment variables");
}

// Create PandaDoc API configuration
const cfg = pd_api.createConfiguration({
    authMethods: { apiKey: `API-Key ${API_KEY}` },
    baseServer: new pd_api.ServerConfiguration(BASE_URL, {}),
});

// Initialize PandaDoc Documents API
const apiInstance = new pd_api.DocumentsApi(cfg);

export { apiInstance };
