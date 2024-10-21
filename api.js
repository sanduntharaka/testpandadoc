import * as pd_api from "pandadoc-node-client";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.PANDADOC_API_KEY;

if (!API_KEY) {
    throw Error("PANDADOC_API_KEY is not defined");
}

const cfg = pd_api.createConfiguration({
    authMethods: { apiKey: `API-Key ${API_KEY}` },
    baseServer: new pd_api.ServerConfiguration(
        // Defining the host is optional and defaults to https://api.pandadoc.com
        "https://api.pandadoc.com", {}
    ),
});

const apiInstance = new pd_api.DocumentsApi(cfg);
export { apiInstance };