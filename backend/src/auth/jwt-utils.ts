import jwt from 'jsonwebtoken';
import { MOCK_USERS, UserInfo } from '../mock-data';

const ACCESS_TOKEN_SECRET = 'access_token_secret';
const REFRESH_TOKEN_SECRET = 'refresh_token_secret';

export type SafeUserInfo = Omit<UserInfo, 'password'>;

export function generateAccessToken(user: UserInfo): string {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(user: UserInfo): string {
  return jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): SafeUserInfo | null {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
    const user = MOCK_USERS.find((item) => item.username === decoded.username);
    if (!user) return null;
    const { password: _pwd, ...userinfo } = user;
    return userinfo;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): SafeUserInfo | null {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;
    const user = MOCK_USERS.find((item) => item.username === decoded.username);
    if (!user) return null;
    const { password: _pwd, ...userinfo } = user;
    return userinfo;
  } catch {
    return null;
  }
}
