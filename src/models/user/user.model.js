const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const CustomError = require("../../utils/customError");
const { getNextDocumentId } = require("../../utils/db.js");

const userSchema = mongoose.Schema(
  {
    _id: Number,
    organizationId: {
      type: Number,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },

    organizations: [
      {
        organizationId: {
          type: Number,
          ref: "organization",
        },
        name: String,
        roles: [String],
        default: [],
      },
    ],
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new CustomError(httpStatus.BAD_REQUEST, "Invalid email address");
        }
      },
    },
    password: {
      type: String,
      // required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new CustomError(httpStatus.BAD_REQUEST, "Password must contain at least one letter and one number");
        }
      },
      private: true, // used by the toJSON plugin
    },
    googleId: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
  { _id: false }
);

// add plugin that converts mongoose to json
// userSchema.plugin(toJSON);
// userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  if (user.isNew) {
    let id = await getNextDocumentId("userId");
    user._id = id;
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model("User", userSchema);

module.exports = User;
