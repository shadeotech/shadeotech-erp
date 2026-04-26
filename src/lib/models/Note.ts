import mongoose, { Schema, Model } from 'mongoose';

export type NoteType = 'NOTE' | 'CALL' | 'TEXT' | 'EMAIL';

export interface Note {
  _id?: mongoose.Types.ObjectId;
  content: string;
  noteType: NoteType;
  customerId: string;
  createdById: string;
  /** Inbound or outbound — used for CALL and EMAIL entries */
  direction?: 'INBOUND' | 'OUTBOUND';
  /** Call outcome label */
  outcome?: string;
  /** Email subject line */
  subject?: string;
  /** When the activity actually occurred (may differ from createdAt) */
  loggedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const NoteSchema = new Schema<Note>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    noteType: {
      type: String,
      enum: ['NOTE', 'CALL', 'TEXT', 'EMAIL'],
      default: 'NOTE',
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    createdById: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ['INBOUND', 'OUTBOUND'],
    },
    outcome: { type: String },
    subject: { type: String },
    loggedAt: { type: Date },
  },
  { timestamps: true }
);

const NoteModel: Model<Note> = mongoose.models.Note || mongoose.model<Note>('Note', NoteSchema);

export default NoteModel;
