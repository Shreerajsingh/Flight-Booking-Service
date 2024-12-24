const { Booking } = require('../models');
const CrudRepository = require('./crud-repository');
const { Op } = require('sequelize');
const { BOOKING_STATUS } = require('../utils/common/enums');

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

    async cancelOldBooking(timeStamp) {
        const response = await Booking.update({
            status: BOOKING_STATUS.CANCELLED
        },{
            where: {
                [Op.and]: {
                    createdAt: {
                        [Op.lt]: timeStamp
                    },
                    status: {
                        [Op.notIn]: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.CANCELLED]
                    }
                }
            }
        })

        return response;
    }
}

module.exports = BookingRepository;