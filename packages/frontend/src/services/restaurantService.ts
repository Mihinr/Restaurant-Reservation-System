import axios from 'axios';
import { Restaurant, TableAvailability, SearchCriteria } from '@restaurant-reservation/shared';

const TABLE_SERVICE_URL = import.meta.env.VITE_TABLE_SERVICE_URL || 'http://localhost:3003';

export const restaurantService = {
  async getRestaurants(filters?: { city?: string; state?: string }): Promise<{ data: Restaurant[] }> {
    const response = await axios.get<{ success: boolean; data: Restaurant[] }>(
      `${TABLE_SERVICE_URL}/api/v1/restaurants`,
      { params: filters }
    );
    return { data: response.data.data };
  },

  async getRestaurantById(id: string): Promise<{ data: Restaurant }> {
    const response = await axios.get<{ success: boolean; data: Restaurant }>(
      `${TABLE_SERVICE_URL}/api/v1/restaurants/${id}`
    );
    return { data: response.data.data };
  },

  async searchAvailability(
    restaurantId: string,
    criteria: SearchCriteria
  ): Promise<{ data: TableAvailability[] }> {
    const response = await axios.get<{ success: boolean; data: TableAvailability[] }>(
      `${TABLE_SERVICE_URL}/api/v1/restaurants/${restaurantId}/availability`,
      { params: criteria }
    );
    return { data: response.data.data };
  },
};

