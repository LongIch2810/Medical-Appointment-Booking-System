export class PaginationResultDto<T> {
  [key: string]: any;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  constructor(
    key: string,
    data: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    this[key] = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
