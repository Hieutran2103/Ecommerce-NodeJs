const { UnauthenticatedError } = require("../errors");
const checkPermissions = (requestUser, resourseUserId) => {
  if (requestUser.role === "admin") return;
  if (requestUser.userId === resourseUserId.toString()) return;
  throw new UnauthenticatedError("Not authorized to access this route");
};

module.exports = checkPermissions;
