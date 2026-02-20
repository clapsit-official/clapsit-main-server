import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    async healthCheck() {
        const isHealthy = await this.healthService.checkDatabase();

        // In original code there was a lot of mixed logic for logging, 
        // sending responses with custom wrappers. In NestJS we return 
        // the object directly or throw an HttpException.

        if (isHealthy) {
            return {
                success: true,
                data: {
                    timestamp: new Date(),
                },
                message: 'DONE',
                statusCode: HttpStatus.OK,
            };
        } else {
            throw new HttpException(
                {
                    success: false,
                    data: {},
                    message: 'SOMETHING_WENT_WRONG',
                    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                },
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }
}
