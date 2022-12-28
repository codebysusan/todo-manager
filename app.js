const express = require("express");
const app = express();
var csrf = require("csurf");
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("This is a secret key."));
app.use(csrf({ cookie: true }));

const path = require("path");

app.set("view engine", "ejs");

app.get("/", async function (request, response) {
  const listTodos = await Todo.getTodos();
  const overdue = await Todo.getOverdue();
  const dueToday = await Todo.getDuetoday();
  const dueLater = await Todo.getDuelater();
  // console.log(listTodos);
  if (request.accepts("html")) {
    response.render("index", {
      listTodos,
      overdue,
      dueToday,
      dueLater,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ overdue, dueToday, dueLater });
  }
});

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

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

app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo(request.body);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  // console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    const todo = await Todo.remove(request.params.id);
    todo ? response.json(true) : response.json(false);
  } catch (error) {
    return response.status(422).json(error);
  }
});

module.exports = app;
