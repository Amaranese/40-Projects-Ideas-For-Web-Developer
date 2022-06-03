import {DataTableParams} from './types';

export class DataTableResource<T> {

  constructor(private items: T[]) {}

  query(params: DataTableParams, filter?: (item: T, index: number, items: T[]) => boolean): Promise<T[]> {
    params.page = params.page * params.size;
    let result: T[] = [];
    if (filter) {
      result = this.items.filter(filter);
    } else {
      result = this.items.slice(); // shallow copy to use for sorting instead of changing the original
    }

    if (params.sortBy) {
      result.sort((a, b) => {
        if (typeof a[params.sortBy] === 'string') {
          return a[params.sortBy].localeCompare(b[params.sortBy]);
        } else {
          return a[params.sortBy] - b[params.sortBy];
        }
      });
      if (params.sortAsc === false) {
        result.reverse();
      }
    }
    if (params.page !== undefined) {
      if (params.size === undefined) {
        result = result.slice(params.page, result.length);
      } else {
        result = result.slice(params.page, params.page + params.size);
      }
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(result));
    });
  }

  count(): Promise<number> {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(this.items.length));
    });

  }
}
