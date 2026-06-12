const jwt = require("jsonwebtoken");
const {
  userModel,
  organizationModel,
  boardModel,
  issueModel,
} = require("./model");

async function authMiddleware(req, res, next) {
  const token = req.headers.token;

  if (!token) {
    res.status(403).json({
      message: "You are not logged in",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, "superSecretKey");
    const userId = decoded.userId;

    const user = await userModel.findOne({
      _id: userId,
    });

    if (!user) {
      res.json({
        message: "user do not exist",
      });
      return;
    }
    req.userId = userId;
    req.user = user;
    next()
  } 
  catch (err) {
    res.status(403).json({
      message: "Malformed token",
    });
    return;
  }
}

module.exports = {
  authMiddleware,
};
