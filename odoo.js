import axios from "axios";

const ODOO_URL = "https://amanda.soluvia.io";

export async function odooService(params, sessionId) {
    // sessionId = "dbe6eed382fd664eff00f4b4bc769b19c00a5a73"
    const response = await axios.post(
        `${ODOO_URL}/web/dataset/search_read`, {
            jsonrpc: "2.0",
            method: "call",
            params,
        }, {
            withCredentials: true,
            headers: {
                Cookie: `session_id=${sessionId}`,
            },
        }
    );

    return response.data.result;
}
