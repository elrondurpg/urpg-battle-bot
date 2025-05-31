import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

export function initializeServer(app) {
    let protocol = process.env.SERVER_HTTP_PROTOCOL;
    let port = process.env.PORT || 3000;

    if (protocol === "http") {
        initializeHttpServer(app, port);
    }
    else {
        initializeHttpsServer(app, port);
    }
}

function initializeHttpServer(app, port) {
  const server = http.Server(app);
  server.listen(port, () => {
    console.log('Listening for HTTP requests on port', port);
  });
}

function initializeHttpsServer(app, port) {
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

    const server = https.Server(serverOptions, app);
    server.listen(port, () => {
      console.log('Listening for HTTPS requests on port', port);
    });
  }
  else {
    console.log('Could not start HTTPS server due to missing certificate / key files.');
  }
}