const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const path = require("path");
const bcrypt = require("bcrypt");
const salt = 10;
const flash = require("connect-flash");

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("This is a secret key."));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
// eslint-disable-next-line no-undef
app.set("views", path.join(__dirname, "views"));
app.use(flash());

app.use(
  session({
    secret: "my-super-secret-key-368496389505735379271438",
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => [
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          console.log(user);
          if (!user) {
            return done(null, false, {
              message: "Couldn't find the user account",
            });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          return done(error);
        }),
    ]
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.set("view engine", "ejs");

app.get("/", async function (request, response) {
  response.render("index", {
    title: "Todo application",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUserId = request.user.id;
    const listTodos = await Todo.getTodos(loggedInUserId);
    const overDue = await Todo.getOverdue(loggedInUserId);
    const dueToday = await Todo.getDuetoday(loggedInUserId);
    const dueLater = await Todo.getDuelater(loggedInUserId);
    const completedItems = await Todo.getCompleted(loggedInUserId);
    if (request.accepts("html")) {
      response.render("todos", {
        title: "Todo application",
        listTodos,
        overDue,
        dueToday,
        dueLater,
        completedItems,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({ overDue, dueToday, dueLater, completedItems, listTodos });
    }
  }
);

app.get("/signup", async (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", async (request, response) => {
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/todos");
  }
);

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post("/users", async (request, response) => {
  // Hash password using bcrypt
  const hashPassword = await bcrypt.hash(request.body.password, salt);

  // Creating a user here
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashPassword,
    });
    request.logIn(user, (err) => {
      if (err) {
        console.log("From line 173: " + err);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    if (error.name == "SequelizeUniqueConstraintError") {
      request.flash("alert", "Email already in use.");
      return response.redirect("/signup");
    }
    // console.log("From line 180",error);
    if (error.errors[0].message == "Validation len on firstName failed") {
      request.flash("alert", "Enter a valid first name.");
      return response.redirect("/signup");
    }

    if (error.errors[0].message == "Validation isEmail on email failed") {
      request.flash("alert", "Enter a valid email.");
      return response.redirect("/signup");
    }
    // console.log("From line :",error.errors[0].message);
    return response.status(422).json(error);
  }
});

app.get("/todos", async function (_request, response) {
  // console.log("Processing list of all Todos ...");
  const todo = await Todo.getTodos();
  return response.json(todo);
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log(request.user.id);
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      if (error.name == "SequelizeValidationError") {
        request.flash("alert", "Title must contain minimum 5 characters.");
        return response.redirect("/todos");
      }
      if (error.name == "SequelizeDatabaseError") {
        request.flash("alert", "Please enter valid date.");
        return response.redirect("/todos");
      }
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    const { completed } = request.body;

    try {
      const updatedTodo = await todo.setCompletionStatus(completed);
      return response.json(updatedTodo);
    } catch (error) {
      console.log("Error: " + error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    // console.log("We have to delete a Todo with ID: ", request.params.id);
    try {
      const todo = await Todo.remove(request.params.id, request.user.id);
      todo ? response.json(true) : response.json(false);
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
