const mongoose = require('mongoose')
mongoose.connect("url")


const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const OrganizationSchema = new mongoose.Schema({
  title: String,
  description: String,
  admin: mongoose.Types.ObjectId,
  members: [mongoose.Types.ObjectId]
});

const BoardSchema = new mongoose.Schema({
  title: String,
  organizationId: mongoose.Types.ObjectId,
});


const IssueSchema = new mongoose.Schema({
    title: String,
    boardId : mongoose.Types.ObjectId,
    state: String
})

const userModel = mongoose.model("users", UserSchema)
const organizationModel = mongoose.model("organizations", OrganizationSchema)
const boardModel = mongoose.model("boards", BoardSchema)
const issueModel = mongoose.model("issues", IssueSchema)

module.exports = {
    userModel,
    organizationModel,
    boardModel,
    issueModel
}
