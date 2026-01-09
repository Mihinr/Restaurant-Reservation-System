import { Response } from 'express';
import { Request } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { createRestaurantSchema, updateRestaurantSchema } from '../validators/restaurant.validator';
import { CreateRestaurantDto, UpdateRestaurantDto } from '@restaurant-reservation/shared';

export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  async create(req: Request, res: Response): Promise<void> {
    const validatedData = createRestaurantSchema.parse(req.body);
    // Construct DTO without undefined values for exactOptionalPropertyTypes
    const data: CreateRestaurantDto = {
      name: validatedData.name,
      address: validatedData.address,
      city: validatedData.city,
      state: validatedData.state,
      zipCode: validatedData.zipCode,
      timezone: validatedData.timezone,
    };
    if (validatedData.phone) {
      data.phone = validatedData.phone;
    }
    if (validatedData.email) {
      data.email = validatedData.email;
    }
    if (validatedData.openingTime) {
      data.openingTime = validatedData.openingTime;
    }
    if (validatedData.closingTime) {
      data.closingTime = validatedData.closingTime;
    }
    const restaurant = await this.restaurantService.createRestaurant(data);
    res.status(201).json({
      success: true,
      data: restaurant,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Restaurant ID is required',
      });
      return;
    }
    const restaurant = await this.restaurantService.getRestaurantById(id);
    res.json({
      success: true,
      data: restaurant,
    });
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const { city, state, isActive } = req.query;
    const filters = {
      ...(city && { city: city as string }),
      ...(state && { state: state as string }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };
    const restaurants = await this.restaurantService.getRestaurants(filters);
    res.json({
      success: true,
      data: restaurants,
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Restaurant ID is required',
      });
      return;
    }
    const validatedData = updateRestaurantSchema.parse(req.body);
    // Construct DTO without undefined values for exactOptionalPropertyTypes
    const data: UpdateRestaurantDto = {};
    if (validatedData.name !== undefined) data.name = validatedData.name;
    if (validatedData.address !== undefined) data.address = validatedData.address;
    if (validatedData.city !== undefined) data.city = validatedData.city;
    if (validatedData.state !== undefined) data.state = validatedData.state;
    if (validatedData.zipCode !== undefined) data.zipCode = validatedData.zipCode;
    if (validatedData.phone !== undefined) data.phone = validatedData.phone;
    if (validatedData.email !== undefined) data.email = validatedData.email;
    if (validatedData.timezone !== undefined) data.timezone = validatedData.timezone;
    if (validatedData.openingTime !== undefined) data.openingTime = validatedData.openingTime;
    if (validatedData.closingTime !== undefined) data.closingTime = validatedData.closingTime;
    if (validatedData.isActive !== undefined) data.isActive = validatedData.isActive;
    const restaurant = await this.restaurantService.updateRestaurant(id, data);
    res.json({
      success: true,
      data: restaurant,
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Restaurant ID is required',
      });
      return;
    }
    await this.restaurantService.deleteRestaurant(id);
    res.json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  }

  async getBatch(req: Request, res: Response): Promise<void> {
    const { ids } = req.body;
    const restaurantIds = Array.isArray(ids) 
      ? ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
    const restaurants = await this.restaurantService.getRestaurantsByIds(restaurantIds);
    res.json({
      success: true,
      data: restaurants,
    });
  }
}

