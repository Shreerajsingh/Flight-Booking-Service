const { StatusCodes } = require('http-status-codes');

const { Booking } = require('../models');
const CrudRepository = require('./crud-repository');

class BookingRepository extends CrudRepository {
    constructor() {
        super(Booking);
    }

    async create(data, transaction) {
        const response = await Booking.create(data, {transaction: transaction});

        return response;
    }

    async get(id, transaction) {
        const response = await Booking.findByPk(id, {transaction: transaction});

        return response;
    }

    async update(data, id, transaction) {
        const response = await Booking.update(data, {
            where: {
                id: id
            }
        },{transaction: transaction});

        return response;
    }
}

module.exports = BookingRepository;