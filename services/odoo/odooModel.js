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

    async fetchTask(taskId) {
        await this.service.authenticate();
        const taskIds = await this.search([['id', '=', taskId]]);
        if (taskIds.length === 0) throw new Error('Task not found');
        const taskData = await this.read(taskIds, ['name', 'description', 'partner_id']);
        return taskData[0];
    }

    async fetchEmployeeByTaskId(taskId) {
        await this.service.authenticate();
        return this.searchRead(
            [['task_id', '=', taskId]],
            ['date', 'id']
        );
    }

    async fetchPartnerById(partnerId) {
        await this.service.authenticate();
        const partnerData = await this.searchRead(
            [['id', '=', partnerId]],
            ['name', 'street', 'city', 'state_id']
        );
        return partnerData[0];
    }

    async getUser() {
        await this.service.authenticate();
        return this.service;
    }
}

export default OdooModelClass;
