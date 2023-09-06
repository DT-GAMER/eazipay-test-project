const express = require('express');
const expressGraphQL = require('express-graphql').graphqlHTTP;
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');

const app = express();
const port = process.env.PORT || 3000;

// Load environment variables from .env file
require('dotenv').config();

// Connect to MongoDB database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Define MongoDB models 
const User = mongoose.model('User', {
  username: String,
  password: String,
});

// Configure passport for authentication (signup & login)
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Adjust token expiration
      });

      return done(null, user, { token });
    } catch (error) {
      return done(error);
    }
  })
);

// Define GraphQL schema and resolvers
const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type User {
    _id: ID!
    username: String!
  }

  type Query {
    hello: String
    currentUser: User
  }

  type Mutation {
    signup(username: String!, password: String!): User
    login(username: String!, password: String!): User
  }
`);

const root = {
  hello: () => 'Hello, GraphQL World!',
  currentUser: (args, context) => {
    //use context to access the authenticated user
    return context.user;
  },
  signup: async ({ username, password }) => {
    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    return newUser;
  },
  login: async ({ username, password }) => {
    // Authenticate and return a token
    return new Promise((resolve, reject) => {
      passport.authenticate('local', (err, user, info) => {
        if (err) {
          return reject(err);
        }
        if (!user) {
          return reject(new Error(info.message));
        }
        return resolve(user);
      })({ body: { username, password } });
    });
  },
};

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Define GraphQL endpoint
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true, // Enable GraphiQL for development
    context: ({ req }) => ({
      user: req.user, // Pass the authenticated user to the context
    }),
  })
);

app.listen(port, () => {
  console.log(`GraphQL server is running on port ${port}`);
});
