const express = require('express');
const router = express.Router();
const passport = require('passport');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

// get chat-room conversation
router.get('/', passport.authenticate("jwt", {session: false}), (req, res, next) => {
  let response = {success: true};
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

// get conversation
router.get('/:name1/:name2', passport.authenticate("jwt", {session: false}), (req, res, next) => {
  let response = {success: true};
  Conversation.getConversationByName(req.params.name1, req.params.name2, (err, conversation) => {
    if (err) {
      response.success = false;
      response.msg = "There was an error on getting the conversation";
      res.json(response);
    } else {
      response.msg = "Conversation retrieved successfuly";
      //modify this to map each image message to an 'actual' image
      response.conversation = conversation;
      res.json(response);
    }
  });
});

router.post('/:name1/:name2', passport.authenticate("jwt", {session:false}), (req, res, next)=>{
  let response = {success:true};
  img = post.body.image;
  if (img){
    fs.writeFile(`/public/images/${req.params.name1}/${req.params.name2}/${req.body.file_name}`, img, (err2)=>{
      if (err2){
        response.success = false;
        response.msg = "Internal Server Error";
      }
    });
  } else{
    response.success = false;
    response.msg = "sorry, you can not upload an empty message";

  }
  res.json(response);
});

module.exports = router;
