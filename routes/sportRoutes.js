const express = require('express');
const router = express.Router();
const sportController = require('../controllers/sportController');



router.post('/add-sport', sportController.createSport);
router.get('/sports', sportController.getSports);

router.post('/add-court', sportController.createCourt);
router.get('/courts/:sportId', sportController.getCourtsBySport);
router.get('/courts', sportController.getAllCourts);
router.put('/update-court/:courtId', sportController.updateCourtStatus);



module.exports = router;
