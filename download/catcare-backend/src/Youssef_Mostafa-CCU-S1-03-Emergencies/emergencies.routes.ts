import { Router } from 'express';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { emergenciesController } from './emergencies.controller.js';
import {
  createEmergencySchema,
  emergencyIdParamSchema,
  listEmergenciesQuerySchema,
  updateEmergencyStatusSchema
} from './emergencies.schemas.js';

export const emergenciesRoutes = Router();

// report a new emergency — needs to be logged in
emergenciesRoutes.post('/', authMiddleware, validate({ body: createEmergencySchema }), emergenciesController.create);

// browse all emergencies with filters
emergenciesRoutes.get('/', validate({ query: listEmergenciesQuerySchema }), emergenciesController.list);

// priority feed — public, no auth needed
emergenciesRoutes.get('/priority-feed', emergenciesController.priorityFeed);

// change an emergency's status (open → in_progress → resolved)
emergenciesRoutes.patch(
  '/:id/status',
  authMiddleware,
  validate({ params: emergencyIdParamSchema, body: updateEmergencyStatusSchema }),
  emergenciesController.updateStatus
);

// view a single emergency
emergenciesRoutes.get('/:id', validate({ params: emergencyIdParamSchema }), emergenciesController.getById);
