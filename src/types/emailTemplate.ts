export type ICreateAccount = {
    email: string;
    otp: number;
   
};
  
export type IResetPassword = {
    email: string;
    otp: number;
};