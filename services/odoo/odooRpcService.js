// services/odooRpcService.js

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Load Odoo credentials from environment variables
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_PASSWORD = process.env.ODOO_PASSWORD;

let odooSessionId = null;

function extractSessionIdFromCookie(setCookieHeader) {
    const sessionCookie = setCookieHeader.find(cookie => cookie.startsWith('session_id='));
    if (sessionCookie) {
        const match = sessionCookie.match(/session_id=([^;]+)/);
        return match ? match[1] : null;
    }
    return null;
}


/**
 * Login to Odoo and obtain a session ID.
 */
async function loginToOdoo() {
    try {
        const response = await axios.post(`${ODOO_URL}/web/session/authenticate`, {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                db: ODOO_DB,
                login: ODOO_USERNAME,
                password: ODOO_PASSWORD
            }
        });

        const setCookieHeader = response.headers['set-cookie'];

        if (setCookieHeader) {
            odooSessionId = extractSessionIdFromCookie(setCookieHeader);
            if (odooSessionId) {
                return odooSessionId;
            } else {
                throw new Error('Failed to extract session_id from Set-Cookie header.');
            }
        } else {
            throw new Error('Set-Cookie header not found.');
        }
    } catch (error) {
        console.error('Error logging into Odoo:', error);
        throw error;
    }
}

async function callOdooMethod(model, method, args = [], kwargs = {}) {
    if (!odooSessionId) {
        await loginToOdoo();
    }

    try {
        const response = await axios.post(`${ODOO_URL}/web/dataset/call_kw`, {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model,
                method,
                args,
                kwargs
            }
        }, {
            headers: {
                'Cookie': `session_id=${odooSessionId}`
            }
        });

        return response.data.result;
    } catch (error) {
        console.error('Error calling Odoo method:', error);
        throw error;
    }
}

export { loginToOdoo, callOdooMethod };

export async function getCurrentSession(params) {
    if (!odooSessionId) {
        await loginToOdoo();
    }

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
                    Cookie: `session_id=${odooSessionId}`,
                },
            }
        );
        return response.data.result;
    } catch (error) {
        console.error("Error in getCurrentSession:", error);
        throw new Error("Failed to retrieve session information from Odoo");
    }
}
