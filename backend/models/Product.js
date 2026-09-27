const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'],
    default: 'AVAILABLE',
  },
  emoji: {
    type: String,
    default: '📦',
  }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
