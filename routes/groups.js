const express = require('express');
const router = express.Router();
const passport = require('passport');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

// create a new group
router.post('/', passport.authenticate("jwt", { session: false }), (req, res, next) => {
    let response = { success: true };
    Conversation.addConversation(req.body, (err, addedConeversation) => {
        if (err) {
            response.success = false;
            response.msg = "There was an error on adding the group";
            res.json(response);
        } else {
            response.msg = "group added successfuly";
            response.conversation = addedConeversation;
            res.json(response);
        }
    });
});

module.exports = router;
