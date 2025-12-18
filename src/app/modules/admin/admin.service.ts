import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload, Secret } from 'jsonwebtoken'
import config from '../../../config'
import { emailHelper } from '../../../helpers/emailHelper'
import { jwtHelper } from '../../../helpers/jwtHelper'
import { emailTemplate } from '../../../shared/emailTemplate'
import { ResetToken } from '../resetToken/resetToken.model'
import { IAuthResetPassword, IChangePassword, ILoginData, IVerifyEmail } from './admin.interface'
import ApiError from '../../../errors/ApiErrors'
import { Admin } from './admin.model'
import generateOTP from '../../../util/generateOTP'
import cryptoToken from '../../../util/cryptoToken'


//login
const loginAdminFromDB = async (payload: ILoginData) => {
  const { email, password } = payload
  const isExistUser = await Admin.findOne({ email }).select('+password')
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!")
  }

  //check verified and status
  if (!isExistUser.verified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please verify your account, then try to login again',
    )
  }

  //check user status
  if (isExistUser.status === 'delete') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You don’t have permission to access this content.It looks like your account has been deactivated.',
    )
  }

  //check match password
  if (
    password &&
    !(await Admin.isMatchPassword(password, isExistUser.password))
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect!')
  }

  //create token
  const createToken = jwtHelper.createToken(
    {
      id: isExistUser._id,
      role: isExistUser.role,
      email: isExistUser.email,
      name: isExistUser.name,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string,
  )
  const userInfo ={
    id: isExistUser._id,
    role: isExistUser.role,
    email: isExistUser.email,
    name: isExistUser.name,
  }

  return { createToken, userInfo }
}

//forget password
const forgetPasswordToDB = async (email: string) => {
  const isExistUser = await Admin.isExistUserByEmail(email)
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!")
  }

  //send mail
  const otp = generateOTP()
  const value = {
    name: isExistUser.name as string,
    otp: otp,
    email: isExistUser.email as string,
  }
  setTimeout(() => {
    const forgetPassword = emailTemplate.resetPassword(value)
    emailHelper.sendEmail(forgetPassword)
  }, 0)

  //save to DB
  const authentication = {
    isResetPassword: true,
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  }
  await Admin.findOneAndUpdate({ email }, { $set: { authentication } })
}

//verify email
const verifyEmailToDB = async (payload: IVerifyEmail) => {
  const { email, oneTimeCode } = payload
  const isExistUser = await Admin.findOne({ email }).select('+authentication')
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!")
  }

  if (!oneTimeCode) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please give the otp, check your email we send a code',
    )
  }

  if (isExistUser.authentication?.oneTimeCode !== oneTimeCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You provided wrong otp')
  }

  const date = new Date()
  const expireAtDate = isExistUser.authentication?.expireAt
    ? new Date(isExistUser.authentication.expireAt.toString())
    : null

  if (expireAtDate && date > expireAtDate) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Otp already expired, Please try again',
    )
  }

  let message
  let data

  if (!isExistUser.verified) {
    await Admin.findOneAndUpdate(
      { _id: isExistUser._id },
      { verified: true, authentication: { oneTimeCode: null, expireAt: null } },
    )
    message = 'Email verify successfully'
  } else {
    await Admin.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        authentication: {
          isResetPassword: true,
          oneTimeCode: null,
          expireAt: null,
        },
      },
    )

    //create token ;
    const createToken = cryptoToken()
    await ResetToken.create({
      user: isExistUser._id,
      token: createToken,
      expireAt: new Date(Date.now() + 5 * 60000),
    })
    message =
      'Verification Successful: Please securely store and utilize this code for reset password'
    data = createToken
  }

  return { message, data }
}

//reset password
const resetPasswordToDB = async (
  token: string,
  payload: IAuthResetPassword,
) => {
  const { newPassword, confirmPassword } = payload
  //isExist token
  const isExistToken = await ResetToken.isExistToken(token)
  if (!isExistToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized')
  }

  //user permission check
  const isExistUser = await Admin.findById(isExistToken.user).select(
    '+authentication',
  )
  if (!isExistUser?.authentication?.isResetPassword) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "You don't have permission to change the password. Please click again to 'Forgot Password'",
    )
  }

  //validity check
  const isValid = await ResetToken.isExpireToken(token)
  if (!isValid) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Token expired, Please click again to the forget password',
    )
  }

  //check password
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password and Confirm password doesn't match!",
    )
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  )

  const updateData = {
    password: hashPassword,
    authentication: {
      isResetPassword: false,
    },
  }

  await Admin.findOneAndUpdate({ _id: isExistToken.user }, updateData, {
    new: true,
  })
}

const changePasswordToDB = async (
  user: JwtPayload,
  payload: IChangePassword,
) => {
  const { currentPassword, newPassword, confirmPassword } = payload
  const isExistUser = await Admin.findById(user.id).select('+password')
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!")
  }

  //current password match
  if (
    currentPassword &&
    !(await Admin.isMatchPassword(currentPassword, isExistUser.password))
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect')
  }

  //newPassword and current password
  if (currentPassword === newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please give different password from current password',
    )
  }
  //new password and confirm password check
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Password and Confirm password doesn't matched",
    )
  }

  //hash password
  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  )

  const updateData = {
    password: hashPassword,
  }
  await Admin.findOneAndUpdate({ _id: user.id }, updateData, { new: true })
}

export const AdminService = {
  verifyEmailToDB,
  loginAdminFromDB,
  forgetPasswordToDB,
  resetPasswordToDB,
  changePasswordToDB,
}
