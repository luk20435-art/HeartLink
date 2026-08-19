import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientStatus } from './patient-status.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly service: PatientsService) {}

  @Post()
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('search') search?: string,
    @Query('status') status?: PatientStatus,
  ) {
    return this.service.findAllForUser(user, search, status);
  }

  @Get('stats')
  getStats(@CurrentUser() user: User) {
    return this.service.getStats(user);
  }

  @Get('export/preview')
  @Roles(UserRole.STAFF)
  previewExport(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.previewExport(user, from, to);
  }

  @Get('export/excel')
  @Roles(UserRole.STAFF)
  async exportExcel(
    @CurrentUser() user: User,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const buffer = await this.service.exportExcel(user, from, to);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="patients-export.xlsx"',
    });
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }
}
