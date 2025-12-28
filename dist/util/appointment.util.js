"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitAppointmentUpdate = void 0;
const emitAppointmentUpdate = (appointment) => {
    // @ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`appointmentUpdate::${appointment._id}`, appointment);
        console.log(`[Socket] Emitted appointmentUpdate::${appointment._id}`);
    }
};
exports.emitAppointmentUpdate = emitAppointmentUpdate;
