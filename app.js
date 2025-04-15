import 'dotenv/config';
import express from 'express';
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRoute } from './infrastructure/discord/interaction-router.js'

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  let handle = getRoute(req);
  if (handle) {
    return await handle(req, res);
  }
  else {
    return res.send({ type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE });
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
