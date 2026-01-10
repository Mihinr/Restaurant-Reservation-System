import { Request, Response } from 'express';
import { TableController } from '../table.controller';
import { TableService } from '../../services/table.service';

jest.mock('../../services/table.service');
jest.mock('../../validators/table.validator', () => ({
    createTableSchema: { parse: jest.fn((d) => d) },
    updateTableSchema: { parse: jest.fn((d) => d) },
    availabilitySearchSchema: { parse: jest.fn((d) => d) },
}));

describe('TableController', () => {
    let controller: TableController;
    let mockService: jest.Mocked<TableService>;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        mockService = new TableService({} as any) as jest.Mocked<TableService>;
        controller = new TableController(mockService);
        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    it('should create table', async () => {
        req.body = { restaurantId: 'r1', tableNumber: '1' };
        mockService.createTable.mockResolvedValue({ id: 't1' } as any);
        await controller.create(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should get by id', async () => {
        req.params = { id: 't1' };
        mockService.getTableById.mockResolvedValue({ id: 't1' } as any);
        await controller.getById(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if id missing in getById', async () => {
        req.params = { id: '' };
        await controller.getById(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should get by restaurant', async () => {
        req.params = { restaurantId: 'r1' };
        mockService.getTablesByRestaurant.mockResolvedValue([]);
        await controller.getByRestaurant(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if restaurantId missing', async () => {
        req.params = { restaurantId: '' };
        await controller.getByRestaurant(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should update table', async () => {
        req.params = { id: 't1' };
        req.body = { tableNumber: '2', capacity: 2, minPartySize: 1, status: 'AVAILABLE' };
        mockService.updateTable.mockResolvedValue({ id: 't1' } as any);
        await controller.update(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if id missing in update', async () => {
        req.params = { id: '' };
        await controller.update(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should update table status', async () => {
        req.params = { id: 't1' };
        req.body = { status: 'OCCUPIED' };
        mockService.updateTableStatus.mockResolvedValue({ id: 't1' } as any);
        await controller.updateStatus(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if id missing in updateStatus', async () => {
        req.params = { id: '' };
        await controller.updateStatus(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if invalid status in updateStatus', async () => {
        req.params = { id: 't1' };
        req.body = { status: 'INVALID' };
        await controller.updateStatus(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should delete table', async () => {
        req.params = { id: 't1' };
        mockService.deleteTable.mockResolvedValue();
        await controller.delete(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if id missing in delete', async () => {
        req.params = { id: '' };
        await controller.delete(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should get availability', async () => {
        req.params = { restaurantId: 'r1' };
        req.query = { date: '2026-01-20', time: '18:00', partySize: '2' };
        req.body = { reservedTableIds: ['t2'] };
        mockService.findAvailableTables.mockResolvedValue([]);
        await controller.getAvailability(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if restaurantId missing in getAvailability', async () => {
        req.params = { restaurantId: '' };
        await controller.getAvailability(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle missing reservedTableIds in getAvailability', async () => {
        req.params = { restaurantId: 'r1' };
        req.query = { date: '2026-01-20', time: '18:00', partySize: '2' };
        req.body = { reservedTableIds: 'not-array' };
        mockService.findAvailableTables.mockResolvedValue([]);
        await controller.getAvailability(req as Request, res as Response);
        expect(mockService.findAvailableTables).toHaveBeenCalledWith(
            "r1", "2026-01-20", "18:00", "2", undefined, []
        );
    });

    it('should get batch', async () => {
        req.body = { ids: ['t1', 't2', '', 123] };
        mockService.getTablesByIds.mockResolvedValue([]);
        await controller.getBatch(req as Request, res as Response);
        expect(mockService.getTablesByIds).toHaveBeenCalledWith(['t1', 't2']);
    });

    it('should handle non-array ids in getBatch', async () => {
        req.body = { ids: 'not-array' };
        mockService.getTablesByIds.mockResolvedValue([]);
        await controller.getBatch(req as Request, res as Response);
        expect(mockService.getTablesByIds).toHaveBeenCalledWith([]);
    });
});
