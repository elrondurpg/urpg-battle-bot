import { registerInstallCommandsJob } from "../discord/jobs/install-commands-job.js";
import { INACTIVE_BATTLES_JOB, OPEN_BATTLES_JOB } from "./dependency-injection.js";

export function registerJobs() {
    INACTIVE_BATTLES_JOB.register();
    OPEN_BATTLES_JOB.register();
    registerInstallCommandsJob();
}