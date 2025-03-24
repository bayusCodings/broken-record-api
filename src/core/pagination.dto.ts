export interface IPagination {
  page: number;
  size: number;
  total: number;
  pageCount: number;
}

export class PaginationDTO implements IPagination {
  page: number;
  size: number;
  total: number;
  pageCount: number;

  constructor(page: number, size: number, total: number) {
    this.page = page;
    this.size = size;
    this.total = total;

    this.pageCount = Math.ceil(this.total / this.size);
  }
}
