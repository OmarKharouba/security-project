import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { Message } from '../../models/message.model';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  messageList: Array<Message>;
  userList: Array<any>;
  showActive: boolean;
  sendForm: FormGroup;
  username: string;
  chatWith: string;
  currentOnline: boolean;
  receiveMessageObs: any;
  receiveActiveObs: any;
  noMsg: boolean;
  conversationId: string;
  notify: boolean;
  notification: any = { timeout: null };

  groups = [];

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    public formBuilder: FormBuilder,
    public el: ElementRef,
    public authService: AuthService,
    public chatService: ChatService
  ) { }

  ngOnInit() {
    let userData = this.authService.getUserData();
    this.username = userData.user.username;

    this.route.params.subscribe((params: Params) => {
      this.chatWith = params.chatWith;
    });

    this.sendForm = this.formBuilder.group({
      message: ['', Validators.required],
    });

    this.getMessagesHelper();

    this.connectToChat();

    this.getGroups();
  }

  getMessagesHelper() {
    // TODO : should be handled in a better way
    if (this.chatWith.length < 20)
      this.getMessages(this.chatWith);
    else
      this.getGroupMessages(this.chatWith);
  }

  ngOnDestroy() {
    this.receiveActiveObs.unsubscribe();
    this.receiveMessageObs.unsubscribe();
  }

  getGroups() {
    this.authService.getGroups().subscribe(
      (res: any) => {
        this.groups = res.groups;
      }
    )
  }

  connectToChat(): void {
    let connected = this.chatService.isConnected();
    if (connected == true) {
      this.initReceivers();
    } else {
      this.chatService.connect(
        this.username,
        () => {
          this.initReceivers();
        }
      );
    }
  }

  getGroupMessages(groupId) {
    this.chatService.getGroupConversation(groupId).subscribe(data => {
      if (data.success == true) {
        this.conversationId =
          data.conversation._id || data.conversation._doc._id;
        let messages = data.conversation.messages || null;
        messages.forEach(x => {
          x.body = JSON.parse(this.decrypt(x.body));
        });
        if (messages && messages.length > 0) {
          for (let message of messages) {
            this.checkMine(message);
          }
          this.noMsg = false;
          this.messageList = messages;
          this.scrollToBottom();
        } else {
          this.noMsg = true;
          this.messageList = [];
        }
      } else {
        this.onNewConv('chat-room');
      }
    });
  }

  getMessages(name: string): void {
    this.chatService.getConversation(this.username, name).subscribe(data => {
      if (data.success == true) {
        this.conversationId =
          data.conversation._id || data.conversation._doc._id;
        let messages = data.conversation.messages || null;
        if (messages)
          messages.forEach(x => {
            x.body = JSON.parse(this.decrypt(x.body));
          });
        if (messages && messages.length > 0) {
          for (let message of messages) {
            this.checkMine(message);
          }
          this.noMsg = false;
          this.messageList = messages;
          this.scrollToBottom();
        } else {
          this.noMsg = true;
          this.messageList = [];
        }
      } else {
        this.onNewConv('chat-room');
      }
    });
  }

  getUserList(): void {
    this.chatService.getUserList().subscribe(data => {
      if (data.success == true) {
        let users = data.users;
        for (let i = 0; i < users.length; i++) {
          if (users[i].username == this.username) {
            users.splice(i, 1);
            break;
          }
        }
        this.userList = users.sort(this.compareByUsername);

        this.receiveActiveObs = this.chatService
          .receiveActiveList()
          .subscribe(users => {
            for (let onlineUsr of users) {
              if (onlineUsr.username != this.username) {
                let flaggy = 0;
                for (let registered of this.userList) {
                  if (registered.username == onlineUsr.username) {
                    flaggy = 1;
                    break;
                  }
                }
                if (flaggy == 0) {
                  this.userList.push(onlineUsr);
                  this.userList.sort(this.compareByUsername);
                }
              }
            }

            for (let user of this.userList) {
              let flag = 0;
              for (let liveUser of users) {
                if (liveUser.username == user.username) {
                  user.online = true;
                  flag = 1;
                  break;
                }
              }
              if (flag == 0) {
                user.online = false;
              }
            }

            this.currentOnline = this.checkOnline(this.chatWith);
          });

        this.chatService.getActiveList();
      } else {
        this.onNewConv('chat-room');
      }
    });
  }

  initReceivers(): void {
    this.getUserList();

    this.receiveMessageObs = this.chatService
      .receiveMessage()
      .subscribe(message => {
        this.checkMine(message);
        message.body = JSON.parse(this.decrypt(message.body));
        if (message.conversationId == this.conversationId) {
          this.noMsg = false;
          this.messageList.push(message);
          this.scrollToBottom();
          this.msgSound();
        } else if (message.mine != true) {
          if (this.notification.timeout) {
            clearTimeout(this.notification.timeout);
          }
          this.notification = {
            from: message.from,
            inChatRoom: message.inChatRoom,
            text: message.body.text || message.body.image ? "Image" : "Location",
            timeout: setTimeout(() => {
              this.notify = false;
            }, 4000),
          };
          this.notify = true;
          this.notifSound();
        }
      });
  }

  onSendSubmit(): void {
    let newMessage: Message = {
      created: new Date(),
      from: this.username,
      body: {
        text: this.sendForm.value.message,
      },
      conversationId: this.conversationId,
      inChatRoom: this.chatWith == 'chat-room',
    };

    this.chatService.sendMessage({ ...newMessage }, this.chatWith);
    newMessage.mine = true;
    this.noMsg = false;
    this.messageList.push(newMessage);
    this.scrollToBottom();
    this.msgSound();
    this.sendForm.setValue({ message: '' });
  }

  sendLocation() {

    let longitude = 30;
    let latitude = 30;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {

        longitude = pos.coords.longitude;
        latitude = pos.coords.latitude;

        let newMessage: Message = {
          created: new Date(),
          from: this.username,
          conversationId: this.conversationId,
          inChatRoom: this.chatWith == 'chat-room',
          body: {
            longitude: longitude,
            latitude: latitude
          }
        };

        this.chatService.sendMessage({ ...newMessage }, this.chatWith);
        newMessage.mine = true;
        this.noMsg = false;
        this.messageList.push(newMessage);
        this.scrollToBottom();
        this.msgSound();
        this.sendForm.setValue({ message: '' });


      });
    }
  }

  sendImage(event) {
    var files = event.target.files;
    var file = files[0];

    if (files && file) {
      var reader = new FileReader();

      reader.onload = this._handleReaderLoaded.bind(this);

      reader.readAsBinaryString(file);
    }

  }

  _handleReaderLoaded(readerEvt) {
    var binaryString = readerEvt.target.result;
    var base64textString = btoa(binaryString);

    let newMessage: Message = {
      created: new Date(),
      from: this.username,
      body: {
        image: base64textString
      },
      conversationId: this.conversationId,
      inChatRoom: this.chatWith == 'chat-room',
    };

    this.chatService.sendMessage({ ...newMessage }, this.chatWith);
    newMessage.mine = true;
    this.noMsg = false;
    this.scrollToBottom();
    this.msgSound();
    this.sendForm.setValue({ message: '' });
    this.getMessagesHelper();
  }

  checkMine(message: Message): void {
    if (message.from == this.username) {
      message.mine = true;
    }
  }

  onUsersClick(): void {
    this.showActive = !this.showActive;
  }

  onNewGroup(groupId: string) {
    if (this.chatWith != groupId)
      this.router.navigate(['/chat', groupId]);
    this.getGroupMessages(groupId);
  }

  onNewConv(username: string) {
    if (this.chatWith != username)
      this.router.navigate(['/chat', username]);
    if (username != 'new-group') {
      this.getMessages(username);
      this.currentOnline = this.checkOnline(username);
      this.showActive = false;
    }
  }

  notifSound(): void {
    let sound: any = this.el.nativeElement.querySelector('#notifSound');
    sound.play();
  }

  msgSound(): void {
    let sound: any = this.el.nativeElement.querySelector('#msgSound');
    sound.load();
    sound.play();
  }

  scrollToBottom(): void {
    let element: any = this.el.nativeElement.querySelector('.msg-container');
    setTimeout(() => {
      element.scrollTop = element.scrollHeight;
    }, 100);
  }

  checkOnline(name: string): boolean {
    if (name == 'chat-room') {
      for (let user of this.userList) {
        if (user.online == true) {
          return true;
        }
      }
      return false;
    } else {
      for (let user of this.userList) {
        if (user.username == name) {
          return user.online;
        }
      }
    }
  }

  compareByUsername(a, b): number {
    if (a.username < b.username) return -1;
    if (a.username > b.username) return 1;
    return 0;
  }

  decrypt(msg) {
    return this.chatService.decrypt(msg);
  }

}
