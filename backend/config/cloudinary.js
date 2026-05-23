const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

const configureCloudinary = () => {
  if (process.env.STORAGE_PROVIDER === 'cloudinary') {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    logger.info('Cloudinary configured for file storage');
  } else {
    logger.info('Using local file storage');
  }
};

module.exports = { cloudinary, configureCloudinary };
