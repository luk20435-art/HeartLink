import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TempMigrateController } from './temp-migrate.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { HealthRecordsModule } from './health-records/health-records.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { KnowledgeSessionsModule } from './knowledge-sessions/knowledge-sessions.module';
import { SurveyModule } from './survey/survey.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
      }),
    }),
    UsersModule,
    AuthModule,
    PatientsModule,
    HealthRecordsModule,
    KnowledgeModule,
    KnowledgeSessionsModule,
    SurveyModule,
  ],
  controllers: [AppController, TempMigrateController],
  providers: [AppService],
})
export class AppModule {}
