import express from 'express';
import { isBuyer } from '../middleware/authentication.middleware.js';
import { addItemToCartSchema } from './cart.validation.js';
import mongoose from 'mongoose';
import ProductTable from '../product/product.model.js';
import CartTable from './cart.model.js';

const router = express.Router();

// add item to cart
router.post(
  '/cart/item/add',
  isBuyer,
  async (req, res, next) => {
    try {
      const validatedData = await addItemToCartSchema.validate(req.body);

      req.body = validatedData;

      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  (req, res, next) => {
    // extract productId from req.body
    const productId = req.body.productId;

    // check for mongo id validity
    const isValidId = mongoose.isValidObjectId(productId);

    // if not valid id , throw error
    if (!isValidId) {
      return res.status(400).send({ message: 'Invalid product id.' });
    }

    next();
  },
  async (req, res) => {
    // extract product id from req.body
    const productId = req.body.productId;

    // find product
    const product = await ProductTable.findOne({ _id: productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: 'Product does not exist.' });
    }

    // extract orderedQuantity from req.body
    const orderedQuantity = req.body.orderedQuantity;

    // if ordered quantity is greater than product quantity, throw error
    if (orderedQuantity > product.quantity) {
      return res.status(409).send({
        message: 'Ordered quantity cannot be greater than product quantity.',
      });
    }

    // add item to cart
    await CartTable.create({
      buyerId: req.loggedInUserId,
      productId,
      orderedQuantity,
    });

    return res
      .status(200)
      .send({ message: 'Item is added to cart successfully.' });
  }
);

//  delete item from cart by cartId
router.delete(
  '/cart/item/delete/:id',
  isBuyer,
  (req, res, next) => {
    // extract cartId from req.params.id

    const cartId = req.params.id;

    // check for mongo id validity
    const isValidId = mongoose.isValidObjectId(cartId);

    // if not valid mongo id, throw error
    if (!isValidId) {
      return res.status(400).send({ message: 'Invalid object id.' });
    }

    next();
  },
  async (req, res) => {
    // extract cart id from req.params
    const cartId = req.params.id;

    // find cart using cart id
    const cart = await CartTable.findOne({
      _id: cartId,
    });

    // if not cart, throw error
    if (!cart) {
      return res.status(404).send({ message: 'Cart does not exist.' });
    }

    // check ownership
    const isOwnerOfCart = cart.buyerId.equals(req.loggedInUserId);

    // if not owner cart, throw error
    // user is buyer, but this cart item belongs to another buyer
    if (!isOwnerOfCart) {
      return res
        .status(409)
        .send({ message: 'You are not owner of this product.' });
    }

    // delete cart
    await CartTable.deleteOne({ _id: cartId });

    // send res
    return res
      .status(200)
      .send({ message: 'Cart item is removed successfully.' });
  }
);

// flush cart
router.delete('/cart/flush', isBuyer, async (req, res) => {
  // extract buyer id from req.loggedInUserId
  const buyerId = req.loggedInUserId;

  await CartTable.deleteMany({ buyerId: buyerId });

  return res.status(200).send({ message: 'Cart is flushed successfully.' });
});

// list carts
router.post('/cart/list', isBuyer, async (req, res) => {
  const carts = await CartTable.aggregate([
    {
      $match: {
        buyerId: req.loggedInUserId,
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'productDetail',
      },
    },
    {
      $project: {
        orderedQuantity: 1,
        product: {
          name: { $first: '$productDetail.name' },
          price: { $first: '$productDetail.price' },
          quantity: { $first: '$productDetail.quantity' },
          image: { $first: '$productDetail.image' },
          category: { $first: '$productDetail.category' },
          brand: { $first: '$productDetail.brand' },
        },
      },
    },
  ]);

  return res.status(200).send({ message: 'success', cartItems: carts });
});

export { router as cartController };
