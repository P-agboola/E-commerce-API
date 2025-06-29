import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Min, Max, IsOptional } from 'class-validator';
import { Type as TransformType } from 'class-transformer';

// T is used in the derived class
export class PageDto<T> {
  // Array of items for the current page
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Has next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Has previous page',
    example: false,
  })
  hasPreviousPage: boolean;
}

export class PageOptionsDto {
  @ApiProperty({
    description: 'Page number (starts from 1)',
    default: 1,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  @IsOptional()
  @TransformType(() => Number)
  readonly page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(50)
  @IsOptional()
  @TransformType(() => Number)
  readonly limit?: number = 10;

  get skip(): number {
    return (this.page! - 1) * this.limit!;
  }
}

export function createPageDto<T>(ItemsDto: Type<T>): Type<PageDto<T>> {
  class PageDtoClass extends PageDto<T> {
    @ApiProperty({ type: [ItemsDto] })
    items: T[];
  }

  return PageDtoClass as Type<PageDto<T>>;
}
