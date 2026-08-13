import userRepository from '../repositories/user.repository';
import { IUser } from '../types';

class UserService {
  async getAll(): Promise<IUser[]> {
    return userRepository.findAll();
  }

  async toggleActive(id: string): Promise<IUser> {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('User not found');
    const updated = await userRepository.update(id, { isActive: !user.isActive });
    if (!updated) throw new Error('Update failed');
    return updated;
  }
}

export default new UserService();
