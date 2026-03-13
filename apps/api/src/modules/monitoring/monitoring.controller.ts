import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@ApiTags('Monitoring')
@ApiBearerAuth()
@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonitoringController {
    constructor(private readonly monitoringService: MonitoringService) { }

    @Get('health')
    @ApiOperation({ summary: 'Проверка здоровья всех сервисов' })
    async health() {
        return this.monitoringService.checkHealth();
    }

    @Get('resources')
    @Roles('admin')
    @ApiOperation({ summary: 'Мониторинг ресурсов сервера (CPU, RAM, Disk)' })
    async resources() {
        return this.monitoringService.getSystemResources();
    }

    @Get('uptime')
    @ApiOperation({ summary: 'Uptime сервисов' })
    async uptime() {
        return this.monitoringService.getUptime();
    }

    @Get('services')
    @Roles('admin')
    @ApiOperation({ summary: 'Статус всех сервисов' })
    async services() {
        return this.monitoringService.getServicesStatus();
    }

    @Get('logs/recent')
    @Roles('admin')
    @ApiOperation({ summary: 'Последние логи' })
    async recentLogs() {
        return this.monitoringService.getRecentLogs();
    }

    @Get('metrics')
    @ApiOperation({ summary: 'Prometheus метрики' })
    async metrics() {
        return this.monitoringService.getPrometheusMetrics();
    }
}
