const express = require('express');

const { InfoController } = require('../../controllers');
const BookingRoute = require('./booking-router');

const router = express.Router();

router.get('/info', InfoController.info);

router.use('/bookings', BookingRoute)

module.exports = router;