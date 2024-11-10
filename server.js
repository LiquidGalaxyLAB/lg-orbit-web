const express = require("express");
const { Client } = require("ssh2");
const path = require("path");

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Function to establish SSH connection and execute command
function connectAndSendCommand(host, sshPort, username, password, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on("ready", () => {
        console.log("Client :: ready");
        conn.exec(command, (err, stream) => {
          if (err) return reject(err);

          let output = "";
          stream
            .on("close", (code, signal) => {
              console.log(
                `Stream :: close :: code: ${code}, signal: ${signal}`
              );
              conn.end();
              resolve(output);
            })
            .on("data", (data) => {
              output += data;
            })
            .stderr.on("data", (data) => {
              console.error(`STDERR: ${data}`);
            });
        });
      })
      .on("error", (err) => {
        reject(err);
      })
      .connect({
        host,
        port: parseInt(sshPort, 10),
        username,
        password,
      });
  });
}

// POST route to handle orbit command execution
app.post("/execute-orbit", (req, res) => {
  const { host, sshPort, username, password } = req.body;
  console.log("Received data:", req.body);

  const command = 'echo "playtour=Orbit" > /tmp/query.txt';

  connectAndSendCommand(host, sshPort, username, password, command)
    .then((output) => {
      res.json({ success: true, output });
    })
    .catch((error) => {
      res.json({ success: false, message: error.message });
    });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
