import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';

import * as io from 'socket.io-client';
import { Message } from '../models/message.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

import * as crypto from "crypto-js";
// declare var crypto: any;

const BASE_URL = environment.backendUrl;
const CHAT_PATH = environment.chatPath;

@Injectable()
export class ChatService {
  private socket: any;
  private chatUrl: string = environment.chatUrl;
  private apiUrl: string = `${BASE_URL}/messages`;
  private usersUrl: string = `${BASE_URL}/users`;
  private groupsUrl: string = `${BASE_URL}/groups`;

  constructor(public authService: AuthService, public http: Http) { }

  connect(username: string, callback: Function = () => { }): void {
    // initialize the connection
    this.socket = io(this.chatUrl, { path: CHAT_PATH });

    this.socket.on('error', error => {
      console.log('====================================');
      console.log(error);
      console.log('====================================');
    });

    this.socket.on('connect', () => {
      this.sendUser(username);
      console.log('connected to the chat server');
      callback();
    });
  }

  isConnected(): boolean {
    if (this.socket != null) {
      return true;
    } else {
      return false;
    }
  }

  sendUser(username: string): void {
    this.socket.emit('username', { username: username });
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  getGroupConversation(groupId) {
    let url = this.apiUrl;
    let route = '/' + groupId;
    url += route;

    let authToken = this.authService.getUserData().token;

    // prepare the request
    let headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: authToken,
    });
    let options = new RequestOptions({ headers: headers });

    // POST
    let observableReq = this.http.get(url, options).map(this.extractData);

    return observableReq;
  }

  getConversation(name1: string, name2: string): any {
    let url = this.apiUrl;
    if (name2 != 'chat-room') {
      let route = '/' + name1 + '/' + name2;
      url += route;
    }

    let authToken = this.authService.getUserData().token;

    // prepare the request
    let headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: authToken,
    });
    let options = new RequestOptions({ headers: headers });

    // POST
    let observableReq = this.http.get(url, options).map(this.extractData);

    return observableReq;
  }

  // Create a new group
  createGroup(body) {
    let url = this.groupsUrl;

    let authToken = this.authService.getUserData().token;

    // prepare the request
    let headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: authToken,
    });
    let options = new RequestOptions({ headers: headers });

    // POST
    let observableReq = this.http.post(url, body, options).map(this.extractData);

    return observableReq;
  }

  getUserList(): any {
    let url = this.usersUrl;

    let authToken = this.authService.getUserData().token;

    // prepare the request
    let headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: authToken,
    });
    let options = new RequestOptions({ headers: headers });

    // POST
    let observableReq = this.http.get(url, options).map(this.extractData);

    return observableReq;
  }

  receiveMessage(): any {
    let observable = new Observable(observer => {
      this.socket.on('message', (data: Message) => {
        observer.next(data);
      });
    });

    return observable;
  }

  receiveActiveList(): any {
    let observable = new Observable(observer => {
      this.socket.on('active', data => {
        observer.next(data);
      });
    });

    return observable;
  }

  sendMessage(message: Message, chatWith: string): void {
    message.body = this.encryptByDES(JSON.stringify(message.body));
    this.socket.emit('message', { message: message, to: chatWith });
  }

  getActiveList(): void {
    this.socket.emit('getactive');
  }

  extractData(res: Response): any {
    let body = res.json();
    return body || {};
  }




  encryptByDES(message) {
    // For the key, when you pass a string,
    // it's treated as a passphrase and used to derive an actual key and IV.
    // Or you can pass a WordArray that represents the actual key.
    // If you pass the actual key, you must also pass the actual IV.
    var keyHex = crypto.enc.Utf8.parse('9B4A53E4E47DADC2');
    // console.log(CryptoJS.enc.Utf8.stringify(keyHex), CryptoJS.enc.Hex.stringify(keyHex));
    // console.log(CryptoJS.enc.Hex.parse(CryptoJS.enc.Utf8.parse(key).toString(CryptoJS.enc.Hex)));
    // CryptoJS use CBC as the default mode, and Pkcs7 as the default padding scheme
    var encrypted = crypto.DES.encrypt(message, keyHex, {
      mode: crypto.mode.ECB,
      padding: crypto.pad.Pkcs7
    });
    // decrypt encrypt result
    // var decrypted = CryptoJS.DES.decrypt(encrypted, keyHex, {
    //     mode: CryptoJS.mode.ECB,
    //     padding: CryptoJS.pad.Pkcs7
    // });
    // console.log(decrypted.toString(CryptoJS.enc.Utf8));
    // when mode is CryptoJS.mode.CBC (default mode), you must set iv param
    // var iv = 'inputvec';
    // var ivHex = CryptoJS.enc.Hex.parse(CryptoJS.enc.Utf8.parse(iv).toString(CryptoJS.enc.Hex));
    // var encrypted = CryptoJS.DES.encrypt(message, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC });
    // var decrypted = CryptoJS.DES.decrypt(encrypted, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC });
    // console.log('encrypted.toString()  -> base64(ciphertext)  :', encrypted.toString());
    // console.log('base64(ciphertext)    <- encrypted.toString():', encrypted.ciphertext.toString(CryptoJS.enc.Base64));
    // console.log('ciphertext.toString() -> ciphertext hex      :', encrypted.ciphertext.toString());
    return encrypted.toString();
  }

  decryptByDES(ciphertext: string) {
    var keyHex = crypto.enc.Utf8.parse('9B4A53E4E47DADC2');
    // direct decrypt ciphertext
    var decrypted = crypto.DES.decrypt(
      ciphertext
      , keyHex, {
        mode: crypto.mode.ECB,
        padding: crypto.pad.Pkcs7
      });
    return decrypted.toString(crypto.enc.Utf8);
  }
}
