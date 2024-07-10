const httpStatus = require("http-status");
const { User, Organization } = require("../models");
const ApiError = require("../utils/ApiError");
const CustomError = require("../utils/customError");

/** Create a organization
 *  @param {Object} organizationBody
 *  @returns {Promise<Organization>}
 */
const createOrganization = async (body, session) => {
  if (await Organization.isEmailTaken(body.email)) {
    throw new CustomError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  let organizationBody = {
    name: body.name,
    email: body.email,
    userId: body._id,
  };
  const organization = new Organization(organizationBody);
  await organization
    .save({ session })
    .then((res) => {
      return res;
    })
    .catch((err) => {
      console.log("error", err);
      throw new CustomError(httpStatus.BAD_REQUEST, "Organization creation failed..Please try again..");
      console.log(err);
    });
  let newTanant = await Organization.create(organization, { session })
    .then((res) => {
      return res;
    })
    .catch((err) => {
      console.log("error", err);
      throw new CustomError(httpStatus.BAD_REQUEST, "Organization creation failed..Please try again..");
    });
  return newTanant;
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody, session) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new CustomError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const user = new User(userBody);
  await user
    .save({ session })
    .then((res) => {})
    .catch((err) => {
      // console.log("user creation error....");
      // console.log(err);
    });
  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id)
    .select("-password")
    .then((res) => {
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};
const getUserOrganizationlists = async (email) => {
  return User.findOne({ email })
    .then((res) => {
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
};
/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.remove();
  return user;
};

module.exports = {
  createUser,
  createOrganization,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUserOrganizationlists,
};
