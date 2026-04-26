import mongoose, { Schema, Model } from 'mongoose'

export interface IQuoteComment {
  quoteId: string
  itemIndex: number // -1 = quote-level, 0+ = line item index
  userId: string
  userRole: 'CUSTOMER' | 'ADMIN' | 'STAFF'
  userName: string
  body: string
  createdAt?: Date
  updatedAt?: Date
}

const QuoteCommentSchema = new Schema<IQuoteComment>(
  {
    quoteId: { type: String, required: true, index: true },
    itemIndex: { type: Number, default: -1 },
    userId: { type: String, required: true },
    userRole: { type: String, enum: ['CUSTOMER', 'ADMIN', 'STAFF'], required: true },
    userName: { type: String, required: true },
    body: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
)

const QuoteComment: Model<IQuoteComment> =
  mongoose.models.QuoteComment ||
  mongoose.model<IQuoteComment>('QuoteComment', QuoteCommentSchema)

export default QuoteComment
