import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiErrors';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { ILoginData, IVerifyEmail } from '../../../types/auth';
import generateOTP from '../../../util/generateOTP';
import { User } from '../user/user.model';
import { IUser } from '../user/user.interface';
import { validPhoneNumberCheck } from '../../../util/validPhoneNumberCheck';
import mongoose from 'mongoose';
import sendSMS from '../../../shared/sendSMS';


const loginAdminFromDB = async (payload: ILoginData) => {

    const { email, password } = payload;
    const isExistUser: any = await User.findOne({ email }).select('+password');
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    //check verified and status
    if (!isExistUser.verified) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Please verify your account, then try to login again');
    }

    //check match password
    if (password && !(await User.isMatchPassword(password, isExistUser.password))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect!');
    }

    // Create JWT tokens in parallel
    const [accessToken, refreshToken] = await Promise.all([
        jwtHelper.createToken(
            { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
            config.jwt.jwt_secret as Secret,
            config.jwt.jwt_expire_in as string
        ),
        jwtHelper.createToken(
            { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
            config.jwt.jwtRefreshSecret as Secret,
            config.jwt.jwtRefreshExpiresIn as string
        ),
    ]);

    return { accessToken, refreshToken };
};

const loginUserFromDB = async (payload: ILoginData) => {

    const { phone } = payload;

    // Validate phone number
    if (!validPhoneNumberCheck(phone as string)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid phone number. Please enter a valid number to receive an OTP.");
    }

    const existingUser: IUser & { _id: mongoose.Types.ObjectId } | null = await User.findOne({ phone });

    console.log(existingUser)

    if (!existingUser?.verified) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Please verify your account, then try to login again");
    }

    if (!existingUser) {
        return { register: true, verify: false };
    }

    // Generate OTP
    const otp = generateOTP();
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60 * 1000)
    };
    
    await User.updateOne(
        { _id: existingUser._id },
        { $set: { authentication, } }
    );

    await sendSMS(phone as string, otp.toString())



    return { register: false, verify: true };
};

const verifyPhoneToDB = async (payload: IVerifyEmail) => {

    const { phone, oneTimeCode } = payload;

    const isExistUser = await User.findOne({ phone }).select('+authentication');
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }


    if (!oneTimeCode) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Please give the otp, check your Phone we send a code');
    }


    if (isExistUser.authentication?.oneTimeCode !== oneTimeCode) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You provided wrong otp');
    }

    const date = new Date();
    if (date > isExistUser.authentication?.expireAt) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Otp already expired, Please try again');
    }

    if (isExistUser.isDeleted) {
        await User.findOneAndDelete({ phone })
        const data = null;
        const message = "Your Account deleted Successfully."
        return { data, message }
    }


    if (isExistUser.verified === true || isExistUser.verified === false) {
        await User.findOneAndUpdate(
            { _id: isExistUser._id },
            { verified: true, authentication: { oneTimeCode: null, expireAt: null } }
        );

        //create token
        const accessToken = jwtHelper.createToken(
            { id: isExistUser._id, role: isExistUser.role, subscribe: isExistUser.subscribe, phone: isExistUser.phone },
            config.jwt.jwt_secret as Secret,
            config.jwt.jwt_expire_in as string
        );

        //create token
        const refreshToken = jwtHelper.createToken(
            { id: isExistUser._id, role: isExistUser.role, subscribe: isExistUser.subscribe, phone: isExistUser.phone },
            config.jwt.jwtRefreshSecret as Secret,
            config.jwt.jwtRefreshExpiresIn as string
        );

        const data = { accessToken, role: isExistUser.role, subscribe: isExistUser.subscribe, refreshToken }
        const message = "Phone Number verified successfully."

        return { data, message };
    }
};


const newAccessTokenToUser = async (token: string) => {

    // Check if the token is provided
    if (!token) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required!');
    }

    const verifyUser = jwtHelper.verifyToken(
        token,
        config.jwt.jwtRefreshSecret as Secret
    );

    const isExistUser = await User.findById(verifyUser?.id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access")
    }

    //create token
    const accessToken = jwtHelper.createToken(
        { id: isExistUser._id, role: isExistUser.role, subscribe: isExistUser.subscribe, phone: isExistUser.phone },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string
    );

    return { accessToken }
}

const resendVerificationOTPToDB = async (phone: string) => {

    // Find the user by ID
    const existingUser: IUser & { _id: mongoose.Types.ObjectId } | null = await User.findOne({ phone }).lean();

    if (!existingUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User with this email does not exist!',);
    }

    if (existingUser?.verified) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already verified!');
    }

    // Generate OTP
    const otp = generateOTP();
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60 * 1000)
    };

    await sendSMS(phone as string, otp.toString())

    await User.updateOne(
        { _id: existingUser._id },
        { $set: { authentication, } }
    );
};

// delete user
const deleteUserFromDB = async (user: JwtPayload, phone: string) => {

    // Validate phone number
    if (!validPhoneNumberCheck(phone as string)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid phone number. Please enter a valid number to receive an OTP.");
    }

    const isExistUser = await User.findOne({ phone });
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    // Generate OTP
    const otp = generateOTP();
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60 * 1000)
    };

    await sendSMS(phone as string, otp.toString())

    await User.updateOne(
        { _id: isExistUser?._id },
        { $set: { authentication, isDeleted: true } }
    );
    return "Send the Verification OTP to your Phone Number. Kindly verify for the Delete account";
};

export const AuthService = {
    loginUserFromDB,
    verifyPhoneToDB,
    resendVerificationOTPToDB,
    newAccessTokenToUser,
    deleteUserFromDB,
    loginAdminFromDB
};