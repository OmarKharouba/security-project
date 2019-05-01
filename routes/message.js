const express = require('express');
const router = express.Router();
const passport = require('passport');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

// get chat-room conversation
router.get('/', passport.authenticate("jwt", { session: false }), (req, res, next) => {
  let response = { success: true };
  Conversation.getChatRoom((err, chatRoom) => {
    if (err || chatRoom == null) {
      response.success = false;
      response.msg = "There was an error on getting the conversation";
      res.json(response);
    } else {
      response.msg = "Conversation retrieved successfuly";
      response.conversation = chatRoom;
      res.json(response);
    }
  });
});

// get group converstion
router.get('/:id', passport.authenticate("jwt", { session: false }), (req, res, next) => {
  let response = { success: true };
  Conversation.getConversationById(req.params.id, (err, conversation) => {

    let participants = conversation.participants || conversation._doc.participants;
    let found = false;
    participants.forEach(p => {
      if (p.username == req.user.username)
        found = true;
    })
    if (err || !found) {
      response.success = false;
      response.msg = "There was an error on getting the conversation";
      res.json(response);
    } else {
      response.msg = "Conversation retrieved successfuly";
      response.conversation = conversation;
      res.json(response);
    }
  });
});

// get conversation
router.get('/:name1/:name2', passport.authenticate("jwt", { session: false }), (req, res, next) => {
  let response = { success: true };

  let found = (req.user.username == req.params.name1) || (req.user.username == req.params.name2);

  Conversation.getConversationByName(req.params.name1, req.params.name2, (err, conversation) => {
    if (err || !found) {
      response.success = false;
      response.msg = "There was an error on getting the conversation";
      res.json(response);
    } else {
      response.msg = "Conversation retrieved successfuly";
      response.conversation = conversation;
      res.json(response);
    }
  });
});

module.exports = router;
