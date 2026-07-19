import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('user')
export class UserController {
  @UseGuards(JwtGuard)
  @Get('info')
  info(@Req() req: Request) {
    return { code: 0, data: req.user, error: null, message: 'ok' };
  }
}
