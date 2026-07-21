export interface ListResponse<T> {
  data: T[];
  total?: number;
  skip?: number;
  take?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}
