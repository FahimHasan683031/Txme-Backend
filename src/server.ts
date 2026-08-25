import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { errorLogger, logger } from "./shared/logger";
import colors from 'colors';
import { socketHelper } from "./helpers/socketHelper";
import { Server } from "socket.io";
import seedSuperAdmin from "./DB";
import { initRepeatableCronJobs } from "./app/queues/cron.queue";
import dns from 'node:dns'


dns.setServers(['8.8.8.8', '8.8.4.4'])
//uncaught exception
process.on('uncaughtException', error => {
    errorLogger.error('uncaughtException Detected', error);
    process.exit(1);
});


let server: any;

async function main() {
    try {

        await mongoose.connect(config.database_url as string, {
            maxPoolSize: 10,
            minPoolSize: 2,
        });
        logger.info(colors.green('🚀 Database connected successfully'));

        // create super admin
        await seedSuperAdmin();
        initRepeatableCronJobs();

        const port = typeof config.port === 'number' ? config.port : Number(config.port);

        server = app.listen(port, config.ip_address as string, () => {
            logger.info(colors.yellow(`♻️  Application listening on port:${config.port}`));
        });

        //socket
        const io = new Server(server, {
            pingTimeout: 60000,
            cors: {
                origin: '*'
            }
        });

        socketHelper.socket(io);
        //@ts-ignore
        global.io = io;

    } catch (error) {
        errorLogger.error(colors.red('🤢 Failed to connect Database'));
    }

    //handle unhandledRejection
    process.on('unhandledRejection', error => {
        if (server) {
            server.close(() => {
                errorLogger.error('UnhandledRejection Detected', error);
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    });
}

main();

//SIGTERM
process.on('SIGTERM', () => {
    logger.info('SIGTERM IS RECEIVE');
    if (server) {
        server.close();
    }
});  