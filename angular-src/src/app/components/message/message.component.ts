import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';

import { Message } from "../../models/message.model";
import { ChatService } from "../../services/chat.service";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})

export class MessageComponent implements OnInit {
  @Input() message: Message;
  time: string;
  fadeTime: boolean;

  constructor(
    private chatService : ChatService;
  ) {  }

  ngOnInit() {
    setTimeout(()=> {this.updateFromNow(); this.fadeTime = true}, 2000);
    setInterval(()=> {this.updateFromNow()}, 60000);
    if(this.message.text)
      try{
        this.message.text = this.decrypt(this.message.text);
      }catch(e){
        console.log(e);
      }
  }

  updateFromNow(): void {
    this.time = moment(this.message.created).fromNow();
  }

  decrypt(msg: string){
    return this.chatService.decryptByDES(msg);
  }

}
