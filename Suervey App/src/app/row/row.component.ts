import {Component, EventEmitter, forwardRef, Inject, Input, OnDestroy, Output, OnInit} from '@angular/core';
import {DataTableComponent} from '../table/table.component';

@Component({
  selector: 'app-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.css']
})
export class RowComponent implements OnInit {

  // constructor() { }

  ngOnInit() {
  }
  
  @Input() item: any;
  @Input() index: number;
  _itemExpand = {};
  expanded: boolean;

  // row selection:
  public rowSelected = false;
  private _selected: boolean;

  @Output() selectedChange = new EventEmitter();

  get selected() {
    return this._selected;
  }

  set selected(selected) {
    this._selected = selected;
    this.selectedChange.emit(selected);
  }

  get itemExpand() {
    const columns = this.dataTable.columns.filter(column => this.dataTable.columnVisibility(column));
    this._itemExpand = {};
    columns.forEach(value => {
      this._itemExpand[value.property] = this.item[value.property];
    });
    return this._itemExpand;
  }

  // other:

  get displayIndex() {
    if (this.dataTable.pagination) {
      return this.dataTable.displayParams.page + this.index + 1;
    } else {
      return this.index + 1;
    }
  }

  getTooltip() {
    if (this.dataTable.rowTooltip) {
      return this.dataTable.rowTooltip(this.item, this, this.index);
    }
    return '';
  }

  constructor(@Inject(forwardRef(() => DataTableComponent)) public dataTable: DataTableComponent) {
  }

  expand() {
    this.dataTable.collapseAllExpanded(this);
    this.expanded = !this.expanded;
  }

  ngOnDestroy() {
    this.selected = false;
  }
  public getThisElement(): DataTableRow {
    return this;
  }
  

}