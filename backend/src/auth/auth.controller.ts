import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtGuard } from './jwt.guard';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './jwt-utils';
import { MOCK_CODES, MOCK_USERS } from '../mock-data';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { password, username } = req.body;
    if (!password || !username) {
      res.status(400);
      return { code: -1, data: null, error: 'BadRequestException', message: 'Username and password are required' };
    }
    const findUser = MOCK_USERS.find((item) => item.username === username && item.password === password);
    if (!findUser) {
      res.clearCookie('jwt');
      res.status(403);
      return { code: -1, data: null, error: 'Forbidden Exception', message: 'Username or password is incorrect.' };
    }
    const accessToken = generateAccessToken(findUser);
    const refreshToken = generateRefreshToken(findUser);
    res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'none', secure: true });
    return { code: 0, data: { ...findUser, accessToken }, error: null, message: 'ok' };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
    return { code: 0, data: '', error: null, message: 'ok' };
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.jwt;
    if (!refreshToken) {
      res.status(403);
      return { code: -1, data: null, error: 'Forbidden Exception', message: 'Forbidden Exception' };
    }
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
    const userinfo = verifyRefreshToken(refreshToken);
    if (!userinfo) {
      res.status(403);
      return { code: -1, data: null, error: 'Forbidden Exception', message: 'Forbidden Exception' };
    }
    const findUser = MOCK_USERS.find((item) => item.username === userinfo.username);
    if (!findUser) {
      res.status(403);
      return { code: -1, data: null, error: 'Forbidden Exception', message: 'Forbidden Exception' };
    }
    const accessToken = generateAccessToken(findUser);
    res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'none', secure: true });
    return accessToken;
  }

  @UseGuards(JwtGuard)
  @Get('codes')
  codes(@Req() req: Request) {
    const codes = MOCK_CODES.find((item) => item.username === req.user?.username)?.codes ?? [];
    return { code: 0, data: codes, error: null, message: 'ok' };
  }
}
