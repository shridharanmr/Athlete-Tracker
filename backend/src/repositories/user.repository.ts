import User from '../models/User.model';
import { IUser, RegisterDto } from '../types';
import { FilterQuery, UpdateQuery } from 'mongoose';

class UserRepository {
  async findById(id: string, includePassword = false): Promise<IUser | null> {
    const query = User.findById(id);
    if (includePassword) query.select('+password');
    return query.exec();
  }

  async findByUsername(username: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ username });
    if (includePassword) query.select('+password +loginAttempts +lockUntil +refreshToken');
    return query.exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  async findByResetToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    }).exec();
  }

  async findByRefreshToken(token: string): Promise<IUser | null> {
    return User.findOne({ refreshToken: token }).select('+refreshToken').exec();
  }

  async create(data: RegisterDto): Promise<IUser> {
    return User.create(data);
  }

  async update(id: string, data: UpdateQuery<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async save(user: IUser): Promise<IUser> {
    return user.save();
  }

  async findAll(filter: FilterQuery<IUser> = {}): Promise<IUser[]> {
    return User.find(filter).select('-password').exec();
  }

  async deleteById(id: string): Promise<void> {
    await User.findByIdAndDelete(id).exec();
  }
}

export default new UserRepository();
