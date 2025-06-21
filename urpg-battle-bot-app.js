import 'dotenv/config';
import express from 'express';
import { initializeServer } from './infrastructure/app/server.js';
import { registerJobs } from './infrastructure/app/jobs.js';
import { registerResources } from './infrastructure/app/resources.js';
import { registerSignals } from './infrastructure/app/signals.js';
import { BATTLE_ROOM_DATA } from './infrastructure/app/dependency-injection.js';

const app = express();

// enable the app to take HTTP or HTTPS requests based on values in .env
initializeServer(app);

// register REST resources through which the application accepts requests
// most of the application's interesting code flows through here
registerResources(app);

// resume any battles that were in progress when the app went down
BATTLE_ROOM_DATA.loadAll();

// set up jobs that run at defined intervals
registerJobs();

// enable app to respond gracefully to signals such as process termination
registerSignals();

