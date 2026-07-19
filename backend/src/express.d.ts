import { SafeUserInfo } from './auth/jwt-utils';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUserInfo;
    }
  }
}
