import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-new-group',
  templateUrl: './new-group.component.html',
  styleUrls: ['./new-group.component.scss']
})
export class NewGroupComponent implements OnInit {
  @Input() users;
  groupName;
  currentUser: any;

  selectedUsers = [];

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) { }

  ngOnInit() {
    let userData = this.authService.getUserData();
    this.currentUser = userData.user;
    this.selectedUsers.push(userData.user);
  }

  addUser(user) {
    let exists = false;
    this.selectedUsers.forEach(u => {
      if (u.username == user.username)
        exists = true;
    });
    if (!exists)
      this.selectedUsers.push({
        username: user.username,
        id: user._id
      })
  }

  createGroup() {
    if (!this.groupName) {
      alert("please enter group name");
    } else if (this.selectedUsers.length < 2) {
      alert("Please add users to the group first");
    } else {
      let newGroup = {
        participants: this.selectedUsers,
        name: this.groupName
      }
      this.chatService.createGroup(newGroup).subscribe(
        (res: any) => {
          if (res.success)
            alert("group created successfully");
          else
            alert(res.msg);
        },
        (err: any) => {
          alert("error creating group");
        }
      )
    }
  }

}
