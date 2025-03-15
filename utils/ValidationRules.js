export function isDiscordId(input) {
    return input != null || input.match(/^[0-9]+$/g);
}

export class ValidationError extends Error {}