export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string | number;
  take?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string | number;
    prevCursor?: string | number;
  };
  meta: {
    took: number;
    cached: boolean;
  };
}

export interface CursorPaginationParams {
  cursor?: string | number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor?: string | number;
    prevCursor?: string | number;
    hasMore: boolean;
    limit: number;
  };
  meta: {
    took: number;
    cached: boolean;
  };
}

export class PaginationHelper {
  static normalizeParams(params: PaginationParams): {
    page: number;
    limit: number;
    offset: number;
    skip: number;
    take: number;
  } {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(Math.max(1, params.limit || 20), 100);
    const offset = params.offset ?? (page - 1) * limit;

    return {
      page,
      limit,
      offset,
      skip: params.cursor ? 0 : offset,
      take: params.take || limit,
    };
  }

  static buildResult<T>(
    data: T[],
    total: number,
    params: PaginationParams,
    took: number,
    cached: boolean = false,
    idField: keyof T = 'id' as keyof T
  ): PaginationResult<T> {
    const { page, limit, offset } = this.normalizeParams(params);
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const firstItem = data[0];
    const lastItem = data[data.length - 1];

    return {
      data,
      pagination: {
        page,
        limit,
        offset,
        total,
        totalPages,
        hasNext,
        hasPrev,
        nextCursor: hasNext && lastItem ? String(lastItem[idField]) : undefined,
        prevCursor: hasPrev && firstItem ? String(firstItem[idField]) : undefined,
      },
      meta: {
        took,
        cached,
      },
    };
  }

  static buildCursorResult<T>(
    data: T[],
    params: CursorPaginationParams,
    took: number,
    cached: boolean = false,
    idField: keyof T = 'id' as keyof T
  ): CursorPaginationResult<T> {
    const limit = Math.min(Math.max(1, params.limit || 20), 100);
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    const firstItem = items[0];
    const lastItem = items[items.length - 1];

    return {
      data: items,
      pagination: {
        nextCursor: hasMore && lastItem ? String(lastItem[idField]) : undefined,
        prevCursor: params.cursor && firstItem ? String(firstItem[idField]) : undefined,
        hasMore,
        limit,
      },
      meta: {
        took,
        cached,
      },
    };
  }

  static async paginate<T>(
    queryFn: (skip: number, take: number) => Promise<{ data: T[]; total: number }>,
    params: PaginationParams,
    idField: keyof T = 'id' as keyof T
  ): Promise<PaginationResult<T>> {
    const start = Date.now();
    const { skip, take } = this.normalizeParams(params);

    const result = await queryFn(skip, take);
    const took = Date.now() - start;

    return this.buildResult(result.data, result.total, params, took, false, idField);
  }

  static async cursorPaginate<T>(
    queryFn: (cursor: string | number | undefined, limit: number) => Promise<T[]>,
    params: CursorPaginationParams,
    idField: keyof T = 'id' as keyof T
  ): Promise<CursorPaginationResult<T>> {
    const start = Date.now();
    const limit = Math.min(Math.max(1, params.limit || 20), 100) + 1;

    const data = await queryFn(params.cursor, limit);
    const took = Date.now() - start;

    return this.buildCursorResult(data, { ...params, limit }, took, false, idField);
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  took?: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      offset: (page - 1) * limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    meta: {
      took: took || 0,
      cached: false,
    },
  };
}

export function parsePaginationParams(query: {
  page?: string;
  limit?: string;
  offset?: string;
  cursor?: string;
}): PaginationParams {
  return {
    page: query.page ? parseInt(query.page, 10) : undefined,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
    offset: query.offset ? parseInt(query.offset, 10) : undefined,
    cursor: query.cursor,
  };
}

export function validatePaginationParams(params: PaginationParams): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (params.page !== undefined && params.page < 1) {
    errors.push('Page must be greater than 0');
  }

  if (params.limit !== undefined) {
    if (params.limit < 1) {
      errors.push('Limit must be at least 1');
    }
    if (params.limit > 100) {
      errors.push('Limit cannot exceed 100');
    }
  }

  if (params.offset !== undefined && params.offset < 0) {
    errors.push('Offset cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
