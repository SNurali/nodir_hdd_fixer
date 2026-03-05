import {
    PipeTransform,
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly _schema: ZodSchema) { }

    transform(value: unknown) {
        try {
            return this._schema.parse(value);
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map(
                    (e) => `${e.path.join('.')}: ${e.message}`,
                );
                throw new BadRequestException({
                    message: 'Validation failed',
                    errors: messages,
                });
            }
            throw new BadRequestException('Validation failed');
        }
    }
}
