import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const ODOO_URL = process.env.ODOO_URL;

if (!ODOO_URL) {
    throw new Error("ODOO_URL is not defined in the environment variables");
}

export async function odooService(params, sessionId) {
    try {
        const response = await axios.post(
            `${ODOO_URL}/web/dataset/search_read`,
            {
                jsonrpc: "2.0",
                method: "call",
                params,
            },
            {
                withCredentials: true,
                headers: {
                    Cookie: `session_id=${sessionId}`,
                },
            }
        );
        return response.data.result;
    } catch (error) {
        console.error("Error in odooService:", error);
        throw new Error("Failed to retrieve data from Odoo");
    }
}

export async function getCurrentSession(params, sessionId) {
    try {
        const response = await axios.post(
            `${ODOO_URL}/web/session/get_session_info`,
            {
                jsonrpc: "2.0",
                method: "call",
                params,
            },
            {
                withCredentials: true,
                headers: {
                    Cookie: `session_id=${sessionId}`,
                },
            }
        );
        return response.data.result;
    } catch (error) {
        console.error("Error in getCurrentSession:", error);
        throw new Error("Failed to retrieve session information from Odoo");
    }
}
