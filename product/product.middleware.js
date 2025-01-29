import ProductTable from './product.model.js';

export const isOwnerOfProduct = async (req, res, next) => {
  // extract product id from req.params
  const productId = req.params.id;

  // find product
  const product = await ProductTable.findOne({ _id: productId });

  // if not product, throw error
  if (!product) {
    return res.status(404).send({ message: 'Product does not exist.' });
  }

  // check if logged in user is owner of product
  // logged in user id should match product seller id

  const isOwnerOfProduct = product.sellerId?.equals(req.loggedInUserId);
  // ? alternative code
  // const isOwnerOfProduct =
  //   product.sellerId.toString() === req.loggedInUserId.toString();

  if (!isOwnerOfProduct) {
    return res
      .status(409)
      .send({ message: 'You have no access to this resource.' });
  }

  next();
};
