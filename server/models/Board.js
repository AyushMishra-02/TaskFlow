import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member',
  },
})

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    background: {
      type: String,
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
  },
  { timestamps: true }
)

// Virtual: all lists belonging to this board
boardSchema.virtual('lists', {
  ref: 'List',
  localField: '_id',
  foreignField: 'board',
})

boardSchema.set('toJSON', { virtuals: true })
boardSchema.set('toObject', { virtuals: true })

export default mongoose.model('Board', boardSchema)
