import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as si from 'systeminformation';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface HealthStatus {
    api: { status: 'up' | 'down'; uptime: number; timestamp: string };
    database: { status: 'up' | 'down'; responseTime?: number };
    redis: { status: 'up' | 'down'; responseTime?: number };
    overall: 'healthy' | 'degraded' | 'down';
}

export interface ResourceUsage {
    cpu: {
        current: number;
        cores: number;
        model: string;
    };
    memory: {
        used: number;
        total: number;
        percent: number;
        free: number;
    };
    disk: {
        used: number;
        total: number;
        percent: number;
        free: number;
        uploadsUsed?: number;
    };
    network: {
        rx_bytes: number;
        tx_bytes: number;
        rx_mb: number;
        tx_mb: number;
    };
}

export interface ServiceStatus {
    name: string;
    status: 'running' | 'stopped' | 'error';
    pid?: number;
    memory?: number;
    cpu?: number;
}

@Injectable()
export class MonitoringService {
    private readonly logger = new Logger(MonitoringService.name);
    private readonly startTime: Date;
    private readonly dbHost: string;
    private readonly dbPort: string;
    private readonly redisPort: string;

    constructor(private readonly configService: ConfigService) {
        this.startTime = new Date();
        this.dbHost = this.configService.get<string>('DB_HOST', 'localhost');
        this.dbPort = this.configService.get<string>('DB_PORT', '5436');
        this.redisPort = this.configService.get<string>('REDIS_PORT', '6380');
    }

    async checkHealth(): Promise<HealthStatus> {
        const health: HealthStatus = {
            api: {
                status: 'up',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            },
            database: { status: 'down' },
            redis: { status: 'down' },
            overall: 'healthy',
        };

        // Check database
        const dbStart = Date.now();
        try {
            await execAsync(`pg_isready -h ${this.dbHost} -p ${this.dbPort} -t 2`);
            health.database = {
                status: 'up',
                responseTime: Date.now() - dbStart,
            };
        } catch (error) {
            health.database = { status: 'down' };
            health.overall = 'degraded';
            this.logger.error('Database health check failed', error);
        }

        // Check Redis
        const redisStart = Date.now();
        try {
            await execAsync(`redis-cli -p ${this.redisPort} ping`);
            health.redis = {
                status: 'up',
                responseTime: Date.now() - redisStart,
            };
        } catch (error) {
            health.redis = { status: 'down' };
            health.overall = 'degraded';
            this.logger.error('Redis health check failed', error);
        }

        // Overall status
        if (health.database.status === 'down' || health.redis.status === 'down') {
            health.overall = 'degraded';
        }

        if (health.database.status === 'down' && health.redis.status === 'down') {
            health.overall = 'down';
        }

        return health;
    }

    async getSystemResources(): Promise<ResourceUsage> {
        const [cpu, mem, disk, net] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
            si.networkStats(),
        ]);

        const rootDisk = disk.find(d => d.mount === '/') || disk[0];
        const uploadsDisk = disk.find(d => d.mount.includes('uploads'));

        return {
            cpu: {
                current: cpu.currentLoad,
                cores: cpu.cores,
                model: cpu.manufacturer + ' ' + cpu.brand,
            },
            memory: {
                used: Math.round(mem.active / 1024 / 1024),
                total: Math.round(mem.total / 1024 / 1024),
                percent: mem.active / mem.total * 100,
                free: Math.round(mem.available / 1024 / 1024),
            },
            disk: {
                used: Math.round(rootDisk.used / 1024 / 1024 / 1024),
                total: Math.round(rootDisk.size / 1024 / 1024 / 1024),
                percent: rootDisk.use,
                free: Math.round(rootDisk.available / 1024 / 1024 / 1024),
                uploadsUsed: uploadsDisk ? Math.round(uploadsDisk.used / 1024 / 1024 / 1024) : undefined,
            },
            network: {
                rx_bytes: net.reduce((acc, n) => acc + n.rx_bytes, 0),
                tx_bytes: net.reduce((acc, n) => acc + n.tx_bytes, 0),
                rx_mb: Math.round(net.reduce((acc, n) => acc + n.rx_bytes, 0) / 1024 / 1024),
                tx_mb: Math.round(net.reduce((acc, n) => acc + n.tx_bytes, 0) / 1024 / 1024),
            },
        };
    }

    async getUptime(): Promise<{
        api: number;
        apiFormatted: string;
        system: number;
        systemFormatted: string;
    }> {
        const apiUptime = process.uptime();
        const systemUptime = (await execAsync('uptime -p')).stdout.trim();

        return {
            api: apiUptime,
            apiFormatted: this.formatUptime(apiUptime),
            system: systemUptime,
            systemFormatted: systemUptime,
        };
    }

    async getServicesStatus(): Promise<ServiceStatus[]> {
        const services: ServiceStatus[] = [];

        try {
            // Check API process
            const apiProcesses = await execAsync('pgrep -f "node.*main.js" || echo ""');
            const apiPids = apiProcesses.stdout.trim().split('\n').filter(Boolean).map(Number);
            
            if (apiPids.length > 0) {
                for (const pid of apiPids) {
                    try {
                        const [mem, cpu] = await Promise.all([
                            execAsync(`ps -o rss= -p ${pid} || echo "0"`),
                            execAsync(`ps -o %cpu= -p ${pid} || echo "0"`),
                        ]);
                        services.push({
                            name: 'API Server',
                            status: 'running',
                            pid: pid,
                            memory: parseInt(mem.stdout.trim()) / 1024,
                            cpu: parseFloat(cpu.stdout.trim()),
                        });
                    } catch {
                        services.push({
                            name: 'API Server',
                            status: 'running',
                            pid: pid,
                        });
                    }
                }
            } else {
                services.push({ name: 'API Server', status: 'stopped' });
            }

            // Check PostgreSQL
            try {
                await execAsync(`pg_isready -h ${this.dbHost} -p ${this.dbPort} -t 2`);
                services.push({ name: 'PostgreSQL', status: 'running' });
            } catch {
                services.push({ name: 'PostgreSQL', status: 'stopped' });
            }

            // Check Redis
            try {
                await execAsync(`redis-cli -p ${this.redisPort} ping`);
                services.push({ name: 'Redis', status: 'running' });
            } catch {
                services.push({ name: 'Redis', status: 'stopped' });
            }

            // Check Docker containers
            try {
                const dockerResult = await execAsync('docker ps --format "{{.Names}}:{{.Status}}"');
                const containers = dockerResult.stdout.trim().split('\n').filter(Boolean);
                for (const container of containers) {
                    const [name, status] = container.split(':');
                    services.push({
                        name: `Docker: ${name}`,
                        status: status.includes('Up') ? 'running' : 'stopped',
                    });
                }
            } catch {
                // Docker not available or no containers
            }

        } catch (error) {
            this.logger.error('Error getting services status', error);
            services.push({ name: 'Unknown', status: 'error' });
        }

        return services;
    }

    async getRecentLogs(limit: number = 50): Promise<string[]> {
        try {
            const { stdout } = await execAsync(`tail -n ${limit} /var/log/nodir_hdd_fixer/*.log 2>/dev/null || echo "Logs not found"`);
            return stdout.split('\n').filter(Boolean);
        } catch {
            return ['Logs not available'];
        }
    }

    async getPrometheusMetrics(): Promise<string> {
        const resources = await this.getSystemResources();
        const health = await this.checkHealth();

        return `
# HELP recovery_uz_cpu_usage CPU usage percentage
# TYPE recovery_uz_cpu_usage gauge
recovery_uz_cpu_usage ${resources.cpu.current}

# HELP recovery_uz_memory_usage Memory usage percentage
# TYPE recovery_uz_memory_usage gauge
recovery_uz_memory_usage ${resources.memory.percent}

# HELP recovery_uz_disk_usage Disk usage percentage
# TYPE recovery_uz_disk_usage gauge
recovery_uz_disk_usage ${resources.disk.percent}

# HELP recovery_uz_api_uptime API uptime in seconds
# TYPE recovery_uz_api_uptime counter
recovery_uz_api_uptime ${process.uptime()}

# HELP recovery_uz_database_status Database status (1=up, 0=down)
# TYPE recovery_uz_database_status gauge
recovery_uz_database_status ${health.database.status === 'up' ? 1 : 0}

# HELP recovery_uz_redis_status Redis status (1=up, 0=down)
# TYPE recovery_uz_redis_status gauge
recovery_uz_redis_status ${health.redis.status === 'up' ? 1 : 0}
`.trim();
    }

    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        
        return parts.join(' ') || '< 1m';
    }
}
