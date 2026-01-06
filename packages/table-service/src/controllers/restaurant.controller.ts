import { Response } from 'express';
import { Request } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { createRestaurantSchema, updateRestaurantSchema } from '../validators/restaurant.validator';

export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  async create(req: Request, res: Response): Promise<void> {
    const data = createRestaurantSchema.parse(req.body);
    const restaurant = await this.restaurantService.createRestaurant(data);
    res.status(201).json({
      success: true,
      data: restaurant,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
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
    const data = updateRestaurantSchema.parse(req.body);
    const restaurant = await this.restaurantService.updateRestaurant(id, data);
    res.json({
      success: true,
      data: restaurant,
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await this.restaurantService.deleteRestaurant(id);
    res.json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  }
}

