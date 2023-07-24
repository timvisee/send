## Requirements

This document describes how to do a full deployment of Send on your own Linux server. You will need:

* A working (and ideally somewhat recent) installation of NodeJS and npm
* Git
* Apache webserver
* Optionally telnet, to be able to quickly check your installation

For example in Debian/Ubuntu systems:

```bash
sudo apt install git apache2 nodejs npm telnet
```

## Building

* We assume an already configured virtual-host on your webserver with an existing empty htdocs folder
* First, remove that htdocs folder - we will replace it with Send's version now
* git clone https://github.com/timvisee/send.git htdocs
* Make now sure you are NOT root but rather the user your webserver is serving files under (e.g. "su www-data" or whoever the owner of your htdocs folder is)
* npm install
* npm run build

## Running

To have a permanently running version of Send as a background process:

* Create a file `run.sh` with:

```bash
#!/bin/bash
nohup su www-data -c "npm run prod" 2>/dev/null &
```

* Execute the script:

```bash
chmod +x run.sh
./run.sh
```

Now the Send backend should be running on port 1443. You can check with:

```bash
telnet localhost 1443
```

## Reverse Proxy

Of course, we don't want to expose the service on port 1443. Instead we want our normal webserver to forward all requests to Send ("Reverse proxy").

# Apache webserver

* Enable Apache required modules:

```bash
sudo a2enmod headers
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
```

* Edit your Apache virtual host configuration file, insert this:

```
# Enable rewrite engine
RewriteEngine on

# Make sure the original domain name is forwarded to Send
# Otherwise the generated URLs will be wrong
ProxyPreserveHost on

# Make sure the generated URL is https://
RequestHeader set X-Forwarded-Proto https

# If it's a normal file (e.g. PNG, CSS) just return it
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule .* - [L]

# If it's a websocket connection, redirect it to a Send WS connection
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule /(.*) ws://127.0.0.1:1443/$1 [P,L]

# Otherwise redirect it to a normal HTTP connection
RewriteRule ^/(.*)$ http://127.0.0.1:1443/$1 [P,QSA]
ProxyPassReverse  "/" "http://127.0.0.1:1443"
```

* Test configuration and restart Apache:

```bash
sudo apache2ctl configtest
sudo systemctl restart apache2
```
