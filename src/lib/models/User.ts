import mongoose, { Schema, Model } from 'mongoose';
import type { User as UserType } from '@/types/database';

const UserSchema = new Schema<UserType>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    fax: {
      type: String,
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    town: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    postcode: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'STAFF', 'DEALER', 'FRANCHISEE', 'CUSTOMER'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
    permissions: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation during development
const User: Model<UserType> = mongoose.models.User || mongoose.model<UserType>('User', UserSchema);

export default User;
