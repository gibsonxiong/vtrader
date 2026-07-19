import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { JwtGuard } from './auth/jwt.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtGuard)
  @Get('upload')
  upload() {
    return { code: 0, data: { url: 'https://unpkg.com/@vtraderjs/static-source@0.1.7/source/logo-v1.webp' }, error: null, message: 'ok' };
  }

  @Get('status')
  status(@Query('status') status: string, @Res({ passthrough: true }) res: Response) {
    res.status(Number(status));
    return { code: -1, data: null, error: status, message: status };
  }

  @Get('test')
  testGet() {
    return 'Test get handler';
  }

  @Post('test')
  testPost() {
    return 'Test post handler';
  }
}
