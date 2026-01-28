
import mongoose from 'mongoose';
import { User } from './src/app/modules/user/user.model';
import config from './src/config';

async function diagnose() {
    try {
        await mongoose.connect(config.database_url as string);
        console.log('Connected to database');

        const emailDupes = await User.aggregate([
            { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
        ]);
        console.log('Duplicate Emails:', JSON.stringify(emailDupes, null, 2));

        const phoneDupes = await User.aggregate([
            { $group: { _id: '$phone', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
        ]);
        console.log('Duplicate Phones:', JSON.stringify(phoneDupes, null, 2));

        // Check if there are users where email or phone might be 'undefined' or 'null' as strings
        const suspiciousUsers = await User.find({
            $or: [
                { email: 'undefined' },
                { email: 'null' },
                { phone: 'undefined' },
                { phone: 'null' },
                { email: '' },
                { phone: '' }
            ]
        });
        console.log('Suspicious Users (empty or literal "null"/"undefined"):', suspiciousUsers.length);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Diagnosis failed:', error);
    }
}

diagnose();
