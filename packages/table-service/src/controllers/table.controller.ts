import { Response } from 'express';
import { Request } from 'express';
import { TableService } from '../services/table.service';
import {
  createTableSchema,
  updateTableSchema,
  availabilitySearchSchema,
} from '../validators/table.validator';
import { UpdateTableDto } from '@restaurant-reservation/shared';

export class TableController {
  constructor(private tableService: TableService) {}

  async create(req: Request, res: Response): Promise<void> {
    const data = createTableSchema.parse(req.body);
    const table = await this.tableService.createTable(data);
    res.status(201).json({
      success: true,
      data: table,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Table ID is required',
      });
      return;
    }
    const table = await this.tableService.getTableById(id);
    res.json({
      success: true,
      data: table,
    });
  }

  async getByRestaurant(req: Request, res: Response): Promise<void> {
    const restaurantId = (req.params.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      res.status(400).json({
        success: false,
        error: 'Restaurant ID is required',
      });
      return;
    }
    const tables = await this.tableService.getTablesByRestaurant(restaurantId);
    res.json({
      success: true,
      data: tables,
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Table ID is required',
      });
      return;
    }
    const validatedData = updateTableSchema.parse(req.body);
    // Construct DTO without undefined values for exactOptionalPropertyTypes
    const data: UpdateTableDto = {};
    if (validatedData.tableNumber !== undefined) data.tableNumber = validatedData.tableNumber;
    if (validatedData.capacity !== undefined) data.capacity = validatedData.capacity;
    if (validatedData.minPartySize !== undefined) data.minPartySize = validatedData.minPartySize;
    if (validatedData.status !== undefined) data.status = validatedData.status;
    const table = await this.tableService.updateTable(id, data);
    res.json({
      success: true,
      data: table,
    });
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Table ID is required',
      });
      return;
    }
    const { status } = req.body;
    if (!status || !['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
      return;
    }
    const table = await this.tableService.updateTableStatus(id, status);
    res.json({
      success: true,
      data: table,
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Table ID is required',
      });
      return;
    }
    await this.tableService.deleteTable(id);
    res.json({
      success: true,
      message: 'Table deleted successfully',
    });
  }

  async getAvailability(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params;
    if (!restaurantId) {
      res.status(400).json({
        success: false,
        error: 'Restaurant ID is required',
      });
      return;
    }
    const query = availabilitySearchSchema.parse(req.query);
    const reservedTableIds = Array.isArray(req.body.reservedTableIds)
      ? (req.body.reservedTableIds as string[])
      : [];

    const tables = await this.tableService.findAvailableTables(
      restaurantId,
      query.date,
      query.time,
      query.partySize,
      query.duration,
      reservedTableIds
    );

    res.json({
      success: true,
      data: tables,
    });
  }

  async getBatch(req: Request, res: Response): Promise<void> {
    const { ids } = req.body;
    const tableIds = Array.isArray(ids) 
      ? ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
    const tables = await this.tableService.getTablesByIds(tableIds);
    res.json({
      success: true,
      data: tables,
    });
  }
}

