import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import roleRoute from './role.route.js';

export default (app) => {
  app.use('/api/v1/auth', authRoute);
  app.use('/api/v1/users', userRoute);
  app.use('/api/v1/roles', roleRoute);
}