import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { AdminModule } from './admin/admin.module';
import { InternshipModule } from './intership/internship.module';

@Module({
  imports: [AuthModule, PrismaModule, ReportsModule, TasksModule, TimeEntriesModule, AdminModule, InternshipModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
