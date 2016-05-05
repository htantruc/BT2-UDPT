// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },

    //save messages from order user
    message_rec      : [{
        user_send    : String,
        message      : String, 
        read         :{type:Boolean, default: false}, 
        Date         : Date
    }],

    //save messages sended to order user
    message_send     : [{
        user_rec     : String,
        message      : String, 
        Date_send    : Date,
        Date_seen    : Date
    }],


    // save list friend
    friendship       : [{
        email        : String,
        isblocked    : {type: Boolean, default:false}
    }]

});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
