const cron = require('node-cron');

function scheduleCron() {
    cron.schedule("*/2 * * * *", async() => {
        console.log(">>CRON--JOB<<");
        const {BookingService} = require('../../services');
        const response = await BookingService.cancelOldBooking();
        console.log(response);
    });
}

module.exports = {
    scheduleCron
}