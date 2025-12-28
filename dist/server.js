"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = require("./shared/logger");
const colors_1 = __importDefault(require("colors"));
const socketHelper_1 = require("./helpers/socketHelper");
const socket_io_1 = require("socket.io");
const DB_1 = __importDefault(require("./DB"));
const scheduleUnverifiedAccountCleanup_1 = require("./cronjob/scheduleUnverifiedAccountCleanup");
//uncaught exception
process.on('uncaughtException', error => {
    logger_1.errorLogger.error('uncaughtException Detected', error);
    process.exit(1);
});
let server;
async function main() {
    try {
        // create super admin
        (0, DB_1.default)();
        (0, scheduleUnverifiedAccountCleanup_1.scheduleUnverifiedAccountCleanup)();
        mongoose_1.default.connect(config_1.default.database_url);
        logger_1.logger.info(colors_1.default.green('🚀 Database connected successfully'));
        const port = typeof config_1.default.port === 'number' ? config_1.default.port : Number(config_1.default.port);
        server = app_1.default.listen(port, config_1.default.ip_address, () => {
            logger_1.logger.info(colors_1.default.yellow(`♻️  Application listening on port:${config_1.default.port}`));
        });
        //socket
        const io = new socket_io_1.Server(server, {
            pingTimeout: 60000,
            cors: {
                origin: '*'
            }
        });
        socketHelper_1.socketHelper.socket(io);
        //@ts-ignore
        global.io = io;
    }
    catch (error) {
        logger_1.errorLogger.error(colors_1.default.red('🤢 Failed to connect Database'));
    }
    //handle unhandledRejection
    process.on('unhandledRejection', error => {
        if (server) {
            server.close(() => {
                logger_1.errorLogger.error('UnhandledRejection Detected', error);
                process.exit(1);
            });
        }
        else {
            process.exit(1);
        }
    });
}
main();
//SIGTERM
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM IS RECEIVE');
    if (server) {
        server.close();
    }
});
