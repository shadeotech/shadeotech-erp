import mongoose, { Schema, Model } from 'mongoose'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Task {
  _id?: mongoose.Types.ObjectId
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  assignedTo: string[] // Array of user IDs
  assignedToNames: string[] // Array of user names for quick display
  followUpDate?: Date
  dueDate: Date
  customerId?: string
  customerName?: string
  relatedTo?: string // Related quote/order/contract/invoice number
  createdBy?: string // User ID who created the task
  createdAt?: Date
  updatedAt?: Date
}

const TaskSchema = new Schema<Task>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      required: true,
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'TODO',
      required: true,
    },
    assignedTo: {
      type: [String],
      default: [],
      required: true,
    },
    assignedToNames: {
      type: [String],
      default: [],
    },
    followUpDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    customerId: {
      type: String,
    },
    customerName: {
      type: String,
      trim: true,
    },
    relatedTo: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent re-compilation during development
const TaskModel: Model<Task> =
  mongoose.models.Task ||
  mongoose.model<Task>('Task', TaskSchema)

export default TaskModel
