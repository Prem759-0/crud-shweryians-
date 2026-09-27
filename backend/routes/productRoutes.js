const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('stock').isNumeric().withMessage('Stock must be a number').isInt({ min: 0 }).withMessage('Stock cannot be negative'),
];

router.route('/')
  .get(getProducts)
  .post(protect, productValidation, validate, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, productValidation, validate, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
