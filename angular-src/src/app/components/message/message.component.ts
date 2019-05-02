import { Component, OnInit, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as moment from 'moment';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})

export class MessageComponent implements OnInit {
  @Input() message;
  time: string;
  fadeTime: boolean;

  constructor(
    public _DomSanitizationService: DomSanitizer
  ) { }

  ngOnInit() {
    setTimeout(() => { this.updateFromNow(); this.fadeTime = true }, 2000);
    setInterval(() => { this.updateFromNow() }, 60000);
  }

  updateFromNow(): void {
    this.time = moment(this.message.created).fromNow();
  }

  getUrl(img) {
    return this._DomSanitizationService.bypassSecurityTrustUrl("data:image/png;base64, " + img);
  }

}
