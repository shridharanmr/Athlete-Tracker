import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  _id: Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  location: string;
  description?: string;
  coach: Types.ObjectId;
  participants: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name:         { type: String, required: true, trim: true, maxlength: 150 },
    date:         { type: Date, required: true },
    time:         { type: String, required: true },
    location:     { type: String, required: true, trim: true, maxlength: 200 },
    description:  { type: String, maxlength: 1000 },
    coach:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'Athlete' }],
  },
  { timestamps: true }
);

EventSchema.index({ coach: 1, date: -1 });

export default mongoose.model<IEvent>('Event', EventSchema);
