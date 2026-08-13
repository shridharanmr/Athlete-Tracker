import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Event from '../models/Event.model';
import { AuthRequest, UserRole } from '../types';

const coachFilter = (req: AuthRequest) =>
  req.user!.role === UserRole.Coach ? { coach: req.user!._id } : {};

export const getEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const events = await Event.find(coachFilter(req))
      .populate('participants', 'name eventCategory profilePhoto')
      .sort({ date: 1 })
      .exec();
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};

export const getEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findOne({ _id: req.params.id, ...coachFilter(req) })
      .populate('participants', 'name eventCategory profilePhoto paymentStatus')
      .exec();
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.create({ ...req.body, coach: req.user!._id, participants: [] });
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, ...coachFilter(req) },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, ...coachFilter(req) });
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
};

export const addParticipant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { athleteId } = req.body;
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, ...coachFilter(req) },
      { $addToSet: { participants: new Types.ObjectId(athleteId) } },
      { new: true }
    ).populate('participants', 'name eventCategory profilePhoto paymentStatus');
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const removeParticipant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, ...coachFilter(req) },
      { $pull: { participants: new Types.ObjectId(req.params.athleteId) } },
      { new: true }
    ).populate('participants', 'name eventCategory profilePhoto paymentStatus');
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};
