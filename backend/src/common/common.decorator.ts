import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  Type,
} from '@nestjs/common';
import { PaginatedResponseDto, PaginationParamsDto } from './common.dto';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const GetPaginationParams = createParamDecorator(
  (data: number | undefined, ctx: ExecutionContext): PaginationParamsDto => {
    const request = ctx.switchToHttp().getRequest();
    const page = parseInt(request.query.page, 10) || 1;
    const itemsPerPage = parseInt(request.query.itemsPerPage, 10) || data || 50;

    return {
      itemsPerPage,
      page,
    };
  },
);

export const PaginatedApiOkResponse = <GenericType extends Type<unknown>>(
  data: GenericType,
) =>
  applyDecorators(
    ApiExtraModels(PaginatedResponseDto, data),
    ApiOkResponse({
      description: `The paginated result of ${data.name}`,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(data) },
              },
            },
            required: ['items'],
          },
        ],
      },
    }),
  );
