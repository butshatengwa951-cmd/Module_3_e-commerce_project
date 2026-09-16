import e from 'express';
const r=e.Router();
import c from '../controllers/deliveryController.js';
r.get('/:id',c.getDelivery);r.patch('/:id/progress',c.updateProgress);
export default r;