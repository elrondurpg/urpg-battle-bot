import { registerInteractionsResource } from "./resources/interactions-resource.js";

export function registerResources(expressApp) {
    registerInteractionsResource(expressApp);
}