import athleteRepository from '../repositories/athlete.repository';
import userRepository from '../repositories/user.repository';
import { IAthlete, UserRole, AthleteCredentials } from '../types';
import { IUser } from '../types';
import { FilterQuery } from 'mongoose';

interface AthleteFilters {
  search?: string;
  gender?: string;
  paymentStatus?: string;
}

class AthleteService {
  async getAll(user: IUser, page: number, limit: number, filters: AthleteFilters = {}) {
    const filter: FilterQuery<IAthlete> = { isActive: true };

    // Coaches only see their own athletes
    if (user.role === UserRole.Coach) {
      filter.coach = user._id;
    }

    // Search by name (case-insensitive regex — no text index needed)
    if (filters.search) {
      filter.name = { $regex: filters.search, $options: 'i' };
    }

    if (filters.gender) {
      filter.gender = filters.gender;
    }

    if (filters.paymentStatus) {
      filter.paymentStatus = filters.paymentStatus;
    }

    return athleteRepository.findAll(filter, page, limit);
  }

  async getById(id: string, user: IUser): Promise<IAthlete> {
    const athlete = await athleteRepository.findById(id);
    if (!athlete) throw new Error('Athlete not found');
    this._checkCoachAccess(athlete, user);
    return athlete;
  }

  async create(
    data: Partial<IAthlete>,
    user: IUser
  ): Promise<{ athlete: IAthlete; credentials: AthleteCredentials }> {
    if (!data.coach) {
      data.coach = user._id;
    }

    // Auto-generate login credentials
    const dob = new Date(data.dateOfBirth as Date);
    const dd   = String(dob.getDate()).padStart(2, '0');
    const mm   = String(dob.getMonth() + 1).padStart(2, '0');
    const yyyy = dob.getFullYear();
    const autoPassword = `${dd}${mm}${yyyy}`;
    const autoUsername = data.mobileNumber as string;

    const existingUser = await userRepository.findByUsername(autoUsername);
    let athleteUserId: IUser['_id'] | undefined;

    if (!existingUser) {
      const athleteUser = await userRepository.create({
        username: autoUsername,
        email: data.email || `${autoUsername}@athlete.local`,
        password: autoPassword,
        role: UserRole.Athlete,
      });
      athleteUserId = athleteUser._id;
    } else {
      athleteUserId = existingUser._id;
    }

    data.userId = athleteUserId;
    const athlete = await athleteRepository.create(data);

    return {
      athlete,
      credentials: {
        username: autoUsername,
        password: autoPassword,
        note: 'Username is the mobile number. Password is Date of Birth in DDMMYYYY format.',
      },
    };
  }

  async update(id: string, data: Partial<IAthlete>, user: IUser): Promise<IAthlete> {
    const athlete = await athleteRepository.findById(id);
    if (!athlete) throw new Error('Athlete not found');
    this._checkCoachAccess(athlete, user);

    const updated = await athleteRepository.update(id, data);
    if (!updated) throw new Error('Update failed');
    return updated;
  }

  async delete(id: string, user: IUser): Promise<void> {
    const athlete = await athleteRepository.findById(id);
    if (!athlete) throw new Error('Athlete not found');
    this._checkCoachAccess(athlete, user);
    // Soft delete — keeps data intact, just hides from lists
    await athleteRepository.update(id, { isActive: false });
  }

  async search(query: string, user: IUser): Promise<IAthlete[]> {
    const coachId = user.role === UserRole.Coach ? user._id.toString() : undefined;
    return athleteRepository.search(query, coachId);
  }

  private _checkCoachAccess(athlete: IAthlete, user: IUser): void {
    if (user.role === UserRole.Coach) {
      const coachId = typeof athlete.coach === 'object' && '_id' in athlete.coach
        ? (athlete.coach as { _id: { toString(): string } })._id.toString()
        : athlete.coach.toString();
      if (coachId !== user._id.toString()) {
        throw new Error('Not authorised to access this athlete');
      }
    }
  }
}

export default new AthleteService();
