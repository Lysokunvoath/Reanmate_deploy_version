import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.decorators.js';
import { VersionService } from './version.service.js';
import type { VersionInfo } from './version.service.js';

@Controller('version')
export class VersionController {
  constructor(private readonly version: VersionService) {}

  @Public()
  @Get()
  getVersion(): VersionInfo {
    return this.version.getVersion();
  }
}