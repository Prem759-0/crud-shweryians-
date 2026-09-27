const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).populate('user', 'name email');
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, status, emoji } = req.body;
    
    const product = new Product({
      name,
      description,
      price,
      stock,
      status: status || 'AVAILABLE',
      emoji: emoji || '📦',
      user: req.user._id,
    });
    
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('user', 'name email');
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      return next(new Error('Product not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, status, emoji } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (product) {
      // Check if user is owner
      if (product.user.toString() !== req.user._id.toString()) {
        res.status(401);
        return next(new Error('User not authorized to update this product'));
      }
      
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price !== undefined ? price : product.price;
      product.stock = stock !== undefined ? stock : product.stock;
      if (status) product.status = status;
      if (emoji) product.emoji = emoji;
      
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      return next(new Error('Product not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      if (product.user.toString() !== req.user._id.toString()) {
        res.status(401);
        return next(new Error('User not authorized to delete this product'));
      }
      
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      return next(new Error('Product not found'));
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
