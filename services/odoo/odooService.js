import axios from 'axios';
import OdooModelClass from './odooModel.js';

class OdooService {
  constructor(url, db, username, password) {
    this.url = url;
    this.db = db;
    this.username = username;
    this.password = password;
    this.uid = null;
    this.client = axios.create({
      baseURL: `${this.url}/jsonrpc`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async jsonRpcCall(method, params) {
    try {
      const response = await this.client.post('', {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: Math.floor(Math.random() * 1000000),
      });

      if (response.data.error) {
        console.error("Odoo Server Error Details:", response.data.error);
        throw new Error(`Odoo Server Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      console.error("Error in jsonRpcCall:", error.message);
      throw new Error("Odoo Server Error");
    }
  }

  async authenticate() {
    this.uid = await this.jsonRpcCall('call', {
      service: 'common',
      method: 'authenticate',
      args: [this.db, this.username, this.password, {}],
    });
    return this.uid;
  }

  async search(model, domain) {
    if (!this.uid) throw new Error('Not authenticated');
    return this.jsonRpcCall('call', {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.password, model, 'search', [domain]],
    });
  }

  async read(model, ids, fields) {
    if (!this.uid) throw new Error('Not authenticated');
    return this.jsonRpcCall('call', {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.password, model, 'read', [ids], { fields }],
    });
  }

  async searchRead(model, domain, fields) {
    if (!this.uid) throw new Error('Not authenticated');
    return this.jsonRpcCall('call', {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.password, model, 'search_read', [domain], { fields }],
    });
  }

  async create(model, values) {
    if (!this.uid) throw new Error('Not authenticated');
    return this.jsonRpcCall('call', {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.password, model, 'create', [values]],
    });
  }

  async update(model, id, values) {
    if (!this.uid) throw new Error('Not authenticated');
    return this.jsonRpcCall('call', {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.password, model, 'write', [[id], values]],
    });
  }

  async delete(model, id) {
    if (!this.uid) throw new Error('Not authenticated');
    return this.jsonRpcCall('call', {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.password, model, 'unlink', [[id]]],
    });
  }


  model(modelName) {
    return new OdooModelClass(this, modelName);
  }
}

export { OdooService };
