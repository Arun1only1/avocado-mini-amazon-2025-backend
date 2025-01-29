import express from 'express';
import {
  isBuyer,
  isSeller,
  isUser,
} from '../middleware/authentication.middleware.js';
import { validateMongoIdFromReqParams } from '../middleware/validate.mongo.id.js';
import ProductTable from './product.model.js';
import { productSchema } from './product.validation.js';
import validateReqBody from '../middleware/validate.req.body.middleware.js';
import { paginationSchema } from '../shared/pagination.schema.js';
import { isOwnerOfProduct } from './product.middleware.js';

const router = express.Router();

//  add product
router.post(
  '/product/add',
  isSeller,
  validateReqBody(productSchema),
  async (req, res) => {
    // extract new product from req.body
    const newProduct = req.body;

    // get seller id
    const sellerId = req.loggedInUserId;

    // create product
    await ProductTable.create({ ...newProduct, sellerId });

    // send response
    return res.status(201).send({ message: 'Product is added successfully.' });
  }
);

// list products by buyer
router.post(
  '/product/buyer/list',
  isBuyer,
  validateReqBody(paginationSchema),
  async (req, res) => {
    // extract pagination data from req.body
    const paginationData = req.body;

    const limit = paginationData.limit;

    const page = paginationData.page;

    const skip = (page - 1) * limit;

    const products = await ProductTable.aggregate([
      {
        $match: {},
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalItems = await ProductTable.find().countDocuments();

    const totalPage = Math.ceil(totalItems / limit);

    return res.status(200).send({
      message: 'success',
      productList: products,
      totalPage,
    });
  }
);

// list product by seller
router.post(
  '/product/seller/list',
  isSeller,
  validateReqBody(paginationSchema),
  async (req, res) => {
    // extract pagination data from req.body
    const paginationData = req.body;

    const page = paginationData.page;
    const limit = paginationData.limit;

    // calculate skip using limit and page
    const skip = (page - 1) * limit;

    const products = await ProductTable.aggregate([
      {
        $match: {
          sellerId: req.loggedInUserId, // filter products using sellerId
        },
      },
      {
        $skip: skip,
      },
      { $limit: limit },
      {
        $project: {
          sellerId: 0,
        },
      },
    ]);

    const totalItems = await ProductTable.find({
      sellerId: req.loggedInUserId,
    }).countDocuments();

    const totalPage = Math.ceil(totalItems / limit);

    return res
      .status(200)
      .send({ message: 'success', productList: products, totalPage });
  }
);

// get product details
router.get(
  '/product/detail/:id',
  isUser,
  validateMongoIdFromReqParams,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // find product by id
    const product = await ProductTable.findOne({ _id: productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: 'Product does not exist.' });
    }

    return res
      .status(200)
      .send({ message: 'success', productDetails: product });
  }
);

// delete product by id
// point to remember
// user must be seller
// req.params.id should be valid mongo id
// logged in user id must be same as product's seller id
// if ownership is confirmed, delete product
router.delete(
  '/product/delete/:id',
  isSeller,
  validateMongoIdFromReqParams,
  isOwnerOfProduct,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // delete product
    await ProductTable.deleteOne({ _id: productId });

    return res
      .status(200)
      .send({ message: 'Product is deleted successfully.' });
  }
);

// edit product
router.put(
  '/product/edit/:id',
  isSeller,
  validateMongoIdFromReqParams,
  isOwnerOfProduct,
  validateReqBody(productSchema),
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // extract new values from req.body
    const newValues = req.body;

    // update product
    await ProductTable.updateOne(
      { _id: productId },
      {
        $set: {
          ...newValues,
        },
      }
    );

    return res
      .status(200)
      .send({ message: 'Product is updated successfully.' });
  }
);

export { router as productController };
