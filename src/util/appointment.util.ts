export const emitAppointmentUpdate = (appointment: any) => {
    // @ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`appointmentUpdate::${appointment._id}`, appointment);
        console.log(`[Socket] Emitted appointmentUpdate::${appointment._id}`);
    }
};
