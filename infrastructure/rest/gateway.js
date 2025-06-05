async function send(url, options) {
    options['headers']['Content-Type'] = 'application/json; charset=UTF-8';
    options['headers']['User-Agent'] = 'URPG Battle Bot (https://github.com/elrondurpg/urpg-battle-bot, 1.0.0)';
    if (options.body) options.body = JSON.stringify(options.body);
    const res = await fetch (url, {
        ...options
    });
    if (!res.ok) {
        const data = await res.json();
        //console.log("ERROR: error while sending request: ");
        //console.log(url);
        //console.log(options);
        throw new Error(JSON.stringify(data));
    }
    return res;
}

export async function get(url, options) {
  options['method'] = 'GET';  
  return await send(url, options);
}

export async function post(url, options) {
  options['method'] = 'POST';  
  return await send(url, options);
}

export async function put(url, options) {
  options['method'] = 'PUT';  
  return await send(url, options);
}

export async function patch(url, options) {
  options['method'] = 'PATCH';  
  return await send(url, options);
}
export async function del(url, options) {
  options['method'] = 'DELETE';
  return await send(url, options);
}