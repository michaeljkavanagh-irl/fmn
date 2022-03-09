const mongoose =  require('mongoose');

/**
 * Outline for MongoDB Schema
 */
const commentSchema = mongoose.Schema({
    comment: {type: String, required: false},
    creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    creatorName: {type: String, required: true},
    createdDate: {type: String, required: true},
    filePath: {type: String, required: false},
    plainOldUrl: {type: String, required: false},
    fileName: {type: String, required: false},
    threadId: {type: mongoose.Schema.Types.ObjectId, required: true},
    threadtitle: {type: String, required: true}
});

module.exports = mongoose.model('Comment', commentSchema);