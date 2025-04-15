import 'dotenv/config';
import express from 'express';
import { Server } from 'http';
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRoute } from './infrastructure/discord/interaction-router.js'

// Create an express app
const app = express();

app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  let handle = getRoute(req);
  if (handle) {
    return await handle(req, res);
  }
  else {
    return res.send({ type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE });
  }
});

let serverHttpProtocol = process.env.SERVER_HTTP_PROTOCOL;

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

if (serverHttpProtocol === "http") {
  const server = Server(app);
  server.listen(PORT, () => {
    console.log('Listening for HTTP requests on port', PORT);
  });
}
else {
  const certFile = process.env.SERVER_CERT_FILE_PATH;
  const keyFile = process.env.SERVER_KEY_FILE_PATH;

  if (certFile && keyFile) {
    const serverOptions = {
      // Certificate(s) & Key(s)
      cert: fs.readFileSync(certFile),
      key: fs.readFileSync(keyFile),
    
      // Optional: TLS Versions
      maxVersion: process.env.SERVER_MAX_TLS_VERSION || 'TLSv1.3',
      minVersion: process.env.SERVER_MIN_TLS_VERSION || 'TLSv1.2'
    }

    const server = require('https').Server(serverOptions, app);
    server.listen(PORT, () => {
      console.log('Listening for HTTPS requests on port', PORT);
    });
  }
}
