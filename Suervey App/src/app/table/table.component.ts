import {
  Component, ContentChild, ContentChildren, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges,
  TemplateRef,
  ViewChildren
} from '@angular/core';
import {DataTableIcons, DataTableParams, DataTableTranslations, defaultIcons, defaultTranslations, RowCallback} from '../tools/types';
import {ColumnDirective} from './column.directive';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}