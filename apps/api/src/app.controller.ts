import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
    @Get()
    @ApiOperation({ summary: 'API Root' })
    getHello() {
        return {
            name: 'HDD Fixer Service Center API',
            version: '1.0',
            docs: '/api/docs',
            health: '/v1/health'
        };
    }
}
