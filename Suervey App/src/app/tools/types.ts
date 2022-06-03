import {ColumnDirective} from './column.directive';
import {DataTableRow} from './row.component';

export type RowCallback = (item: any, row: DataTableRow, index: number) => string;

export type CellCallback = (item: any, row: DataTableRow, column: ColumnDirective, index: number) => string;

export interface DataTableTranslations {
  indexColumn: string;
  selectColumn: string;
  expandColumn: string;
  paginationLimit: string;
  paginationRange: string;
}

export let defaultTranslations = <DataTableTranslations>{
  indexColumn: 'index',
  selectColumn: 'select',
  expandColumn: 'expand',
  paginationLimit: 'Limit',
  paginationRange: 'Results'
};


export interface DataTableParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortAsc?: boolean;
}

export interface DataTableIcons {
  sort: string;
  sortAsc: string;
  sortDesc: string;
  paginationNext: string;
  paginationPrevius: string;
  paginationLast: string;
  paginationFirst: string;
}

export let defaultIcons = <DataTableIcons> {
  sort: 'fa fa-sort',
  sortAsc: 'fa fa-sort-amount-asc',
  sortDesc: 'fa fa-sort-amount-desc',
  paginationNext: 'fa fa-angle-right',
  paginationPrevius: 'fa fa-angle-left',
  paginationLast: 'fa fa-angle-double-right',
  paginationFirst: 'fa fa-angle-double-left'
};
