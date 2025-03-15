import 'dotenv/config';
import express from 'express';
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRoute } from './infrastructure/interactions/interaction-router.js'

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  const { id, type, data } = req.body;

  let handle = getRoute(req);
  if (handle) {
    return await handle(req, res);
  }
  else {
    return res.send({ type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE });
  }

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  // do something with unknown interactions
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
