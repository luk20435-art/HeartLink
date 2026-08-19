import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { HealthRecordsService } from './health-records.service';
import { SaveHealthRecordDto } from './dto/save-health-record.dto';

@UseGuards(JwtAuthGuard)
@Controller('patients/:patientId/health-records')
export class HealthRecordsController {
  constructor(private readonly service: HealthRecordsService) {}

  @Get()
  findAll(@Param('patientId') patientId: string, @CurrentUser() user: User) {
    return this.service.findAllForPatient(patientId, user);
  }

  @Put(':visitNumber')
  save(
    @Param('patientId') patientId: string,
    @Param('visitNumber', ParseIntPipe) visitNumber: number,
    @Body() dto: SaveHealthRecordDto,
    @CurrentUser() user: User,
  ) {
    return this.service.save(patientId, visitNumber, dto, user);
  }
}
