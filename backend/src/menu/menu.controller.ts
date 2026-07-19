import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import { MOCK_MENUS } from '../mock-data';

@Controller('menu')
export class MenuController {
  @UseGuards(JwtGuard)
  @Get('all')
  all(@Req() req: Request) {
    const menus = MOCK_MENUS.find((item) => item.username === req.user?.username)?.menus ?? [];
    return { code: 0, data: menus, error: null, message: 'ok' };
  }
}
