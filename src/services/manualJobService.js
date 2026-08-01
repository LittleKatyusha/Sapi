import httpClient from './httpClient';

class ManualJobService {
    // Get backup history (manual + scheduled)
    async getHistory(params = {}) {
        try {
            const response = await httpClient.get('/api/manual-job/history', { params });
            return response;
        } catch (error) {
            console.error('Error fetching backup history:', error);
            throw error;
        }
    }

    // Trigger manual backup
    async triggerBackup(data = {}) {
        try {
            const response = await httpClient.post('/api/manual-job/backup', data);
            return response;
        } catch (error) {
            console.error('Error triggering manual backup:', error);
            throw error;
        }
    }
}

const manualJobService = new ManualJobService();
export default manualJobService;
