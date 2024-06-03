const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { userService } = require("../services");

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "role"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const userId = req.cookies["userId"] || null;
  const orgId = req.cookies["orgId"] || null;
  const user = await userService.getUserById(userId);
  const currentOrganizationId = getCurrentOrganizationId(orgId, user);
  let response = {
    user: user,
    currentOrganizationId: parseInt(currentOrganizationId),
  };
  // const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(response);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});
function getCurrentOrganizationId(orgId, user) {
  let currentOrgId = orgId || null;
  //if the currentOrgId is null , then iterate through the organizations array and get the first organizationId
  if (!orgId) {
    if (user.organizations.length > 0) {
      currentOrgId = user.organizations[0].organizationId;
    }
  }
  return currentOrgId;
}
module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
