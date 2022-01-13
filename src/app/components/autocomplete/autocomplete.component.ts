import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { debounce } from 'src/app/debounce';

@Component({
  selector: 'autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss']
})
export class AutocompleteComponent implements OnInit, OnChanges {

  @ViewChild('inputElem', { static: true }) inputElem: ElementRef;

  @Input()
  public completedata: KeyValuePair[];

  public filterData: KeyValuePair[];

  public focused: boolean;
  public active: number = 0;

  @Input()
  public inputclass: string;

  @Input() value: string;
  @Output() valueChange = new EventEmitter<string>();

  updateValue() {
    this.filter(this.value);
    this.valueChange.emit(this.value);
  }

  constructor() { }

  async ngOnInit() {
    this.filter(this.value);
  }


  async ngOnChanges(changes: SimpleChanges) {
    this.filter(this.value);
  }


  @debounce(50)
  public filter(fs: string) {
    if (fs) {
      this.filterData = this.completedata.filter(cd =>
        cd.value.toLocaleLowerCase().startsWith(fs.toLocaleLowerCase())
      ).splice(0, 40);
      this.active = 0;
    }
    else {
      this.filterData = [];
    }
  }

  public itemClick(key: string) {
    this.value = this.completedata.find(d => d.key == key).value;
    this.updateValue();
    this.focused = false;
    this.inputElem.nativeElement.blur();
  }

  public keyEvent(event) {
    switch (event.key) {
      case "ArrowDown": { this.active++; break; }
      case "ArrowUp": { this.active--; break; }
      case "Enter":
        {
          this.value = this.filterData[this.active].value;
          this.updateValue();
          this.focused = false;
          this.inputElem.nativeElement.blur();
          break;
        }
      case "Escape": { this.focused = false; this.inputElem.nativeElement.blur(); }
    }
    if (this.active < 0) this.active = 0;
    if (this.active >= this.filterData.length) this.active = this.filterData.length - 1;
  }
}

export interface KeyValuePair {
  key: string;
  value: string;
}