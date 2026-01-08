import { Router } from 'express';
import { PrismaClient } from '../node_modules/.prisma/table-service-client';
import { TableController } from '../controllers/table.controller';
import { TableService } from '../services/table.service';
import { validate } from '../middlewares/validate.middleware';
import { createTableSchema, updateTableSchema, batchTableSchema } from '../validators/table.validator';

export function createTableRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const tableService = new TableService(prisma);
  const tableController = new TableController(tableService);

  router.post('/', validate(createTableSchema), (req, res, next) => {
    tableController.create(req, res).catch(next);
  });

  router.post('/batch', validate(batchTableSchema), (req, res, next) => {
    tableController.getBatch(req, res).catch(next);
  });

  router.get('/:id', (req, res, next) => {
    tableController.getById(req, res).catch(next);
  });

  router.put('/:id', validate(updateTableSchema), (req, res, next) => {
    tableController.update(req, res).catch(next);
  });

  router.put('/:id/status', (req, res, next) => {
    tableController.updateStatus(req, res).catch(next);
  });

  router.delete('/:id', (req, res, next) => {
    tableController.delete(req, res).catch(next);
  });

  return router;
}

