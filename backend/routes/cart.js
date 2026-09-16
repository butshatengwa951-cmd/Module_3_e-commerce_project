import e from 'express';
const r=e.Router();
import c from '../controllers/cartController.js';
r.get('/',c.getCart);r.post('/',c.addToCart);r.delete('/',c.clearCart);
export default r;