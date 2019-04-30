import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-active-list',
  templateUrl: './active-list.component.html',
  styleUrls: ['./active-list.component.scss']
})

export class ActiveListComponent implements OnInit {
  @Input() users: Array<String>;
  @Input() groups;
  @Input() current: string;
  @Output() newConv = new EventEmitter<string>();
  @Output() newGroup = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  onUserClick(username: string): boolean {
    this.newConv.emit(username);
    return false;
  }

  onGroupClick(groupId: string) {
    this.newGroup.emit(groupId);
    return false;
  }

}
