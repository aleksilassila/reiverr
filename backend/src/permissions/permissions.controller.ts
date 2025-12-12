import { Controller, Get, Post } from '@nestjs/common';

@Controller('permissions')
export class PermissionsController {
  constructor() {}

  @Get('default')
  getDefaultPermissions() {}

  @Post('default')
  saveDefaultPermissions() {}
}
