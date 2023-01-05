const app = require("./app");

const port = 4000;

app.listen(port, () => {
  console.log("Started express server at port " + port);
});
