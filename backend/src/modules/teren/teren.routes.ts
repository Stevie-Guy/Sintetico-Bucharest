import { Router } from 'express';
import { createTeren, editTeren } from './teren.controller';
import { requireAuth } from '../../middleware/require-auth';
import { fieldReservationRouter } from '../reservations/reservation.routes';
import { scheduleRouter } from './schedule.routes';
// IMPORTA MIDDLEWARE-UL TAU DE AUTENTIFICARE. Numele si calea exacta pot diferi.
// import { requireAuth } from '../../middleware/auth';

const router = Router();

// Rutele protejate de middleware (ex: requireAuth) conform US-02
router.post('/',  requireAuth,  createTeren);
router.put('/:id',  requireAuth,  editTeren);
router.use(fieldReservationRouter);
router.use(scheduleRouter);

export default router;
