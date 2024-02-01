const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../models/user.model.js");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, cb) => {
      // let res = profile;
      let name = profile?.name?.givenName ?? "";
      let email = profile?.emails?.[0]?.value ?? "";
      // Find or create user logic here
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) console.log("Existing user....");
        if (!name || !email) {
          console.log("Incorrect user or email ...".red.bold.underline);
          return cb(null, false);
        }
        if (!user) {
          console.log("New user....".green.bold.underline);
          user = await User.create({ googleId: profile.id, name: name, email: email }); // Additional user info
        }
        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }
  )
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, user);
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

module.exports = passport;
