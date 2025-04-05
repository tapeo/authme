import { Mongoose } from "mongoose";

export enum OtpPurpose {
  EMAIL_VERIFICATION = "email_verification",
  TWO_FACTOR = "two_factor",
}

export interface IOtp extends Document {
  email: string;
  otp: string;
  purpose: OtpPurpose;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
  updated_at: Date;
}

export function registerOtpModel(mongooseInstance: Mongoose) {
  const otpSchema = new mongooseInstance!.Schema<IOtp>(
    {
      email: {
        type: String,
        required: true,
      },
      otp: {
        type: String,
        required: true,
      },
      purpose: {
        type: String,
        enum: OtpPurpose,
        required: true,
      },
      expires_at: {
        type: Date,
        required: true,
        index: { expires: 0 },
      },
      is_used: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

  otpSchema.index({ email: 1, purpose: 1 });

  const OtpModel = mongooseInstance!.model<IOtp>("OTP", otpSchema);

  return OtpModel;
}

export default registerOtpModel;
