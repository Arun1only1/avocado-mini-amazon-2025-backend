import express from 'express';
import { isSeller, isUser } from '../middleware/authentication.middleware.js';
import { validateMongoIdFromReqParams } from '../middleware/validate.mongo.id.js';
import ProductTable from './product.model.js';
import { productSchema } from './product.validation.js';

const router = express.Router();

router.post(
  '/product/add',
  isSeller,
  async (req, res, next) => {
    try {
      // validate req.body using yup schema
      const validatedData = await productSchema.validate(req.body);

      // replace req.body by validated data
      req.body = validatedData;

      // call next function
      next();
    } catch (error) {
      // if validation fails, throw error response
      return res.status(400).send({ message: error.message });
    }
  },
  async (req, res) => {
    // extract new product from req.body
    const newProduct = req.body;

    // create product
    await ProductTable.create(newProduct);

    // send response
    return res.status(201).send({ message: 'Product is added successfully.' });
  }
);

router.get(
  '/product/detail/:id',
  isUser,
  validateMongoIdFromReqParams,
  (req, res) => {
    return res.status(200).send({ message: 'Product detail...' });
  }
);

router.delete(
  '/product/delete/:id',
  isSeller,
  validateMongoIdFromReqParams,
  (req, res) => {
    return res.status(200).send({ message: 'Deleting...' });
  }
);
export { router as productController };
