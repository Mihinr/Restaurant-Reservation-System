import { PrismaClient } from '@prisma/client';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  Restaurant as RestaurantType,
} from '@restaurant-reservation/shared';
import { NotFoundError, ConflictError } from '../errors/AppError';

export class RestaurantService {
  private restaurantRepository: RestaurantRepository;

  constructor(private prisma: PrismaClient) {
    this.restaurantRepository = new RestaurantRepository(prisma);
  }

  async createRestaurant(data: CreateRestaurantDto): Promise<RestaurantType> {
    const restaurant = await this.restaurantRepository.create(data);
    return this.mapToRestaurantType(restaurant);
  }

  async getRestaurantById(id: string): Promise<RestaurantType> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    return this.mapToRestaurantType(restaurant);
  }

  async getRestaurants(filters?: {
    city?: string;
    state?: string;
    isActive?: boolean;
  }): Promise<RestaurantType[]> {
    const restaurants = await this.restaurantRepository.findAll(filters);
    return restaurants.map((restaurant) => this.mapToRestaurantType(restaurant));
  }

  async updateRestaurant(id: string, data: UpdateRestaurantDto): Promise<RestaurantType> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    const updatedRestaurant = await this.restaurantRepository.update(id, data);
    return this.mapToRestaurantType(updatedRestaurant);
  }

  async deleteRestaurant(id: string): Promise<void> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    await this.restaurantRepository.delete(id);
  }

  async getRestaurantsByIds(ids: string[]): Promise<RestaurantType[]> {
    if (ids.length === 0) {
      return [];
    }
    const restaurants = await this.restaurantRepository.findByIds(ids);
    return restaurants.map((restaurant) => this.mapToRestaurantType(restaurant));
  }

  private mapToRestaurantType(restaurant: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
    email: string | null;
    timezone: string;
    openingTime: Date;
    closingTime: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): RestaurantType {
    return {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      zipCode: restaurant.zipCode,
      phone: restaurant.phone || undefined,
      email: restaurant.email || undefined,
      timezone: restaurant.timezone,
      openingTime: this.formatTime(restaurant.openingTime),
      closingTime: this.formatTime(restaurant.closingTime),
      isActive: restaurant.isActive,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }

  private formatTime(time: Date): string {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}

