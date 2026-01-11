import axios from 'axios';
import {
  Restaurant,
  TableAvailability,
  SearchCriteria,
  CreateRestaurantDto,
  UpdateRestaurantDto,
  Table,
  CreateTableDto,
  UpdateTableDto,
} from '@restaurant-reservation/shared';

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

  async getTablesByIds(tableIds: string[]): Promise<{ data: Array<{ id: string; capacity: number; minPartySize: number }> }> {
    if (tableIds.length === 0) {
      return { data: [] };
    }
    const response = await axios.post<{ success: boolean; data: Array<{ id: string; capacity: number; minPartySize: number }> }>(
      `${TABLE_SERVICE_URL}/api/v1/tables/batch`,
      { ids: tableIds }
    );
    return { data: response.data.data };
  },

  // Admin Restaurant Management
  async createRestaurant(data: CreateRestaurantDto): Promise<{ data: Restaurant }> {
    const response = await axios.post<{ success: boolean; data: Restaurant }>(
      `${TABLE_SERVICE_URL}/api/v1/restaurants`,
      data
    );
    return { data: response.data.data };
  },

  async updateRestaurant(id: string, data: UpdateRestaurantDto): Promise<{ data: Restaurant }> {
    const response = await axios.put<{ success: boolean; data: Restaurant }>(
      `${TABLE_SERVICE_URL}/api/v1/restaurants/${id}`,
      data
    );
    return { data: response.data.data };
  },

  async deleteRestaurant(id: string): Promise<void> {
    await axios.delete(`${TABLE_SERVICE_URL}/api/v1/restaurants/${id}`);
  },

  // Admin Table Management
  async getTablesByRestaurant(restaurantId: string): Promise<{ data: Table[] }> {
    const response = await axios.get<{ success: boolean; data: Table[] }>(
      `${TABLE_SERVICE_URL}/api/v1/tables`,
      { params: { restaurantId } }
    );
    return { data: response.data.data };
  },

  async createTable(data: CreateTableDto): Promise<{ data: Table }> {
    const response = await axios.post<{ success: boolean; data: Table }>(
      `${TABLE_SERVICE_URL}/api/v1/tables`,
      data
    );
    return { data: response.data.data };
  },

  async updateTable(id: string, data: UpdateTableDto): Promise<{ data: Table }> {
    const response = await axios.put<{ success: boolean; data: Table }>(
      `${TABLE_SERVICE_URL}/api/v1/tables/${id}`,
      data
    );
    return { data: response.data.data };
  },

  async deleteTable(id: string): Promise<void> {
    await axios.delete(`${TABLE_SERVICE_URL}/api/v1/tables/${id}`);
  },
};

