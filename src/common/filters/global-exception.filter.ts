import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: any = 'SOMETHING_WENT_WRONG';
        let errors: any = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            // Default class-validator response mapping
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                if ((exceptionResponse as any).message && Array.isArray((exceptionResponse as any).message)) {
                    message = (exceptionResponse as any).message[0]; // First validation error
                    errors = { validation: (exceptionResponse as any).message };
                } else if ((exceptionResponse as any).message) {
                    message = (exceptionResponse as any).message;
                }
            } else {
                message = exceptionResponse;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        this.logger.error(`[${request.method}] ${request.url} - Status: ${status} - Message: ${message}`);

        response.status(status).json({
            success: false,
            data: errors || {},
            message,
            statusCode: status,
        });
    }
}
