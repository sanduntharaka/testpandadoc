class OdooModelClass {
    constructor(service, modelName) {
        this.service = service;
        this.modelName = modelName;
    }

    async search(domain) {
        await this.service.authenticate();
        return this.service.search(this.modelName, domain);
    }

    async read(ids, fields) {
        await this.service.authenticate();
        return this.service.read(this.modelName, ids, fields);
    }

    async searchRead(domain, fields) {
        await this.service.authenticate();
        return this.service.searchRead(this.modelName, domain, fields);
    }

    async create(values) {
        await this.service.authenticate();
        return this.service.create(this.modelName, values);
    }

    async update(id, values) {
        await this.service.authenticate();
        return this.service.update(this.modelName, id, values);
    }

    async delete(id) {
        await this.service.authenticate();
        return this.service.delete(this.modelName, id);
    }

    async findOne(domain, fields) {
        const ids = await this.search(domain);
        if (ids.length === 0) return null;
        const records = await this.read([ids[0]], fields);
        return records[0] || null;
    }

    async findAll(domain, fields) {
        const ids = await this.search(domain);
        return this.read(ids, fields);
    }

}

export default OdooModelClass;
