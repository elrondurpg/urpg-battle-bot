import * as REST_GATEWAY from "../rest/gateway.js";

const baseUrl = 'https://discord.com/api/v10/';

export async function get(endpoint) {
  let options = {
    "headers": {
      "Authorization": `Bot ${process.env.DISCORD_TOKEN}`
    }
  }
  return await REST_GATEWAY.get(baseUrl + endpoint, options);
}

export async function post(endpoint, body) {
  let options = {
    "headers": {
      "Authorization": `Bot ${process.env.DISCORD_TOKEN}`
    },
    body: body
  }
  return await REST_GATEWAY.post(baseUrl + endpoint, options);
}

export async function put(endpoint, body) {
  let options = {
    "headers": {
      "Authorization": `Bot ${process.env.DISCORD_TOKEN}`
    },
    body: body
  }
  return await REST_GATEWAY.put(baseUrl + endpoint, options);
}

export async function del(endpoint) {
  let options = {
    "headers": {
      "Authorization": `Bot ${process.env.DISCORD_TOKEN}`
    }
  }
  return await REST_GATEWAY.del(baseUrl + endpoint, options);
}