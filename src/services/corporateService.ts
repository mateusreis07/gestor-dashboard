import api from './api';
import type { CorporateData } from '../utils/corporateData';

export const corporateService = {
  getCorporateData: async (): Promise<CorporateData | null> => {
    try {
      const response = await api.get('/corporate');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  updateCorporateData: async (data: CorporateData): Promise<CorporateData> => {
    const response = await api.put('/corporate', data);
    return response.data;
  },
};
