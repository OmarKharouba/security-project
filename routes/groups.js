const express = require('express');
const router = express.Router();
const passport = require('passport');
const Message = require('../models/message');
const User = require('../models/user');
const Conversation = require('../models/conversation');

// create a new group
router.post('/', passport.authenticate("jwt", { session: false }), (req, res, next) => {
    let response = { success: true };
    Conversation.addConversation(new Conversation(req.body), (err, addedConeversation) => {
        if (err) {
            response.success = false;
            response.msg = "There was an error on adding the group";
            res.json(response);
        } else {
            // Add the group Id to its users
            let users = addedConeversation.participants.map(x => x.username);
            let criteria = {
                username: { $in: users }
            };
            User.update(criteria,
                { $push: { groups: { id: addedConeversation._id, name: addedConeversation.name } } },
                { multi: true },
                (err, res2) => {
                    if (err) {
                        response.success = false;
                        response.msg = "There was an error on adding the group";
                        res.json(response);
                    } else {
                        response.msg = "group added successfuly";
                        response.conversation = addedConeversation;
                        res.json(response);
                    }
                }
            )
        }
    });
});

router.get('/:id', (req, res, next) => {
    let response = { success: true };
    let id = req.params.id;
    Conversation.getConversationById(id, (err, coneversation) => {
        if (err) {
            response.success = false;
            response.msg = "There was an error on retrieving the group chat";
            res.json(response);
        } else {
            response.msg = "coneversation retrieved successfully";
            response.conversation = coneversation;
            res.json(response);
        }
    });
});

module.exports = router;
