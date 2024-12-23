const axios = require('axios');

const { BookingRepository } = require('../repositories');
const bookingRepository = new BookingRepository();
const { sequelize } = require('../models');
const { ServerConfig } = require('../config')
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const  { BOOKING_STATUS } = require('../utils/common/enums');

async function createBooking(data) {
    const transaction = await sequelize.transaction();
    try {
        const result = await sequelize.transaction(async function bookingImpl() {
            const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`);
            const FlightData = flight.data.data;
            if(data.noOfSeats > FlightData.totalSeats) {
                throw new AppError("Not enough seats available", StatusCodes.BAD_REQUEST);
            }
            const totalBillingAmount = data.noOfSeats * FlightData.price;
            const bookingPayload = {...data, totalCost: totalBillingAmount};

            const booking = await bookingRepository.create(bookingPayload, transaction);

            await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`, {
                seats: data.noOfSeats
            })

            return booking;
        })

        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        if(error.message) {
            throw new AppError(error.message, error.statusCodes);
        }
        throw new AppError("Cannot create the booking", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function makePayment(data) {
    const transaction = await sequelize.transaction();
    try {
        const bookingDetail = await bookingRepository.get(data.bookingId, transaction);
        console.log(">>", bookingDetail);

        if(bookingDetail.status == BOOKING_STATUS.CANCELLED) {
            throw new AppError("Booking has expired", StatusCodes.BAD_REQUEST);
        }

        const bookingTime = new Date(bookingDetail.createdAt);
        const currentTime = new Date();

        if(currentTime - bookingTime > 300000) {
            await cancleBooking(data.bookingId);
            throw new AppError("Booking has expired", StatusCodes.GATEWAY_TIMEOUT);
        }

        if(bookingDetail.totalCost != data.totalCost) {
            throw new AppError("The amount of the payment doesn't match", StatusCodes.BAD_REQUEST);
        }

        if(bookingDetail.userId != data.userId) {
            throw new AppError("The user corrosponding to the booking dosen't match", StatusCodes.BAD_REQUEST);
        }

        const response = await bookingRepository.update({status: BOOKING_STATUS.BOOKED}, data.bookingId, transaction);

        await transaction.commit();
        return response;
    } catch (error) {
        await transaction.rollback();
        if(error.message) {
            throw new AppError(error.message, error.statusCodes);
        }
        throw new AppError("Cannot make the payment", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function cancleBooking(bookingId) {
    const transaction = await sequelize.transaction();
    try {
        const bookingDetail = await bookingRepository.get(bookingId, transaction);

        if(bookingDetail.status == BOOKING_STATUS.CANCELLED) {
            await transaction.commit();
            return true;
        }

        await bookingRepository.update({status: BOOKING_STATUS.CANCELLED}, bookingId, transaction);

        await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetail.flightId}/seats`, {
            seats: bookingDetail.noOfSeats,
            dec: false
        }, {transaction: transaction});

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        if(error.message) {
            throw new AppError(error.message, error.statusCodes);
        }
        throw new AppError("Cannot make the payment", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    createBooking,
    makePayment
};