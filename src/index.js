const { trigger, query, filter, listen: on } = require("polyrhythm");

const initialState = { count: 0 };
const state = initialState;

filter("tick", () => {
  state.count += 1;
  console.log(`Ticked ${state.count} times so far! 🤯`);
});

const intervalId = setInterval(() => {
  trigger("tick");
  state.count >= 500 && clearInterval(intervalId);
}, 2000);

// Run an endpoint
const sstatic = require("node-static");
const fileServer = new sstatic.Server(
  require("path").join(__dirname, "public")
);

const app = require("http").createServer((request, response) => {
  fileServer.serve(request, response);
});
const io = require("socket.io").listen(app, { log: false });

app.listen(8080);

// Add websockets
io.on("connection", client => {
  const clientId = client.id.substr(0, 6);
  console.log(`${clientId}: Got a client connection!`);
  client.emit("event", { type: "server/ack", payload: null });

  // each new client subscribes/unsubs to ticks separately
  const ticksSub = query("tick").subscribe(event => {
    console.log(`New tick to ${clientId}`);
    client.emit("event", event);
  });

  client.on("disconnect", () => {
    console.log(`${clientId}: Goodbye!`);
    ticksSub.unsubscribe();
  });
});
