// const { string, required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passport = require('passport-local-mongoose');
 
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});
 
UserSchema.plugin(passport.default);
 
module.exports = mongoose.model('User', UserSchema);