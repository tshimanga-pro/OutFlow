const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose').default || require('passport-local-mongoose')

const subscriberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: true,
    validate: {
      validator: function(v) {
        return /^[A-Z][a-zA-Z\s]*$/.test(v);
      },
      message: "First Name must start with a capital letter and contain no numbers."
    }
  },
  surname: {
    type: String,
    trim: true,
    required: true,
    validate: {
      validator: function(v) {
        return /^[A-Z][a-zA-Z\s]*$/.test(v);
      },
      message: "Surname must start with a capital letter and contain no numbers."
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    required: true
  },

  telephone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
});

subscriberSchema.plugin(passportLocalMongoose, {usernameField: "email"})

module.exports = mongoose.model("Subcribers", subscriberSchema);