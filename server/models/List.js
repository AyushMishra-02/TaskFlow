import mongoose from 'mongoose'

const listSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'List title is required'],
      trim: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

// Virtual: all cards belonging to this list
listSchema.virtual('cards', {
  ref: 'Card',
  localField: '_id',
  foreignField: 'list',
})

listSchema.set('toJSON', { virtuals: true })
listSchema.set('toObject', { virtuals: true })

export default mongoose.model('List', listSchema)
