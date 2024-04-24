import { Strategy } from 'passport-google-oauth20';
import passport from 'passport';
import GoogleAccount from '../models/GoogleAccount.js';

export default () => {
  passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/v1/auth/google/callback`,
    scope: ['email', 'profile']
  }, async function (req, accessToken, refreshToken, profile, cb) {
    let user = await GoogleAccount.findOne({ googleId: profile.id });
    if (!user) {
      user = await GoogleAccount.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        image: profile.photos[0].value,
      });
      const token = user.createJWTForAuthorization()
      return cb(null, { user, token });
    }
    const token = user.createJWTForAuthorization()
    return cb(null, { user, token });
  }
  ))
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser(async (id, done) => {
    const user = await GoogleAccount.findById(id);
    done(null, user);
  });
}