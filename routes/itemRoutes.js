const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Configure storage as needed

// Update your createItem route to use the upload middleware



// Routes for items
router.post('/:organizationId/items', upload.single('imageUrl'), itemController.createItem);
router.get('/:organizationId/items', itemController.getItems);
router.get('/:organizationId/items/:itemId', itemController.getItemById);
router.put('/:organizationId/items/:itemId', itemController.updateItem);
router.delete('/:organizationId/items/:itemId', itemController.deleteItem);

module.exports = router;
