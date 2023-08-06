# [![Send](./assets/icon-64x64.png)](https://gitlab.com/timvisee/send/) Send

A fork of Mozilla's [Firefox-Send](https://github.com/mozilla/send). 
<br>
Simple, private AES-128-GCM end-to-end encrypted file sharing service.

### €⁠20 on [Hetzner Cloud](https://hetzner.cloud/?ref=eLtKhFK70n4h)

### Automatic Installs
```
https://github.com/WhateverItWorks/Watchtower
```

## Deploy with Docker
Ensure [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) are installed before beginning.

Run send in production with docker-compose:
```
apt install git
git clone https://github.com/timvisee/send.git
cd send
nano docker-compose.yml
chmod 777 uploads
docker-compose pull
docker-compose up -d
```
Should be running at: http://localhost:1234

Run send in developer with docker-compose:
```
apt install git
git clone https://github.com/timvisee/send.git
cd send
nano docker-compose.yml
chmod 777 uploads
docker-compose up -d --build
```
Should be running at: http://localhost:1234


## Environment Variables

All the available config options and their defaults can be found here: https://github.com/timvisee/send/blob/master/server/config.js

Config options should be set as unquoted environment variables. Boolean options should be `true`/`false`, time/duration should be integers (seconds), and filesize values should be integers (bytes).

Config options expecting array values (e.g. `EXPIRE_TIMES_SECONDS`, `DOWNLOAD_COUNTS`) should be in unquoted CSV format. UI dropdowns will default to the first value in the CSV, e.g. `DOWNLOAD_COUNTS=5,1,10,100` will show four dropdown options, with `5` selected by the default.

#### Server Configuration

| Name     | Description |
|------------------|-------------|
| `BASE_URL`       | The HTTPS URL where traffic will be served (e.g. `https://send.firefox.com`)
| `DETECT_BASE_URL` | Autodetect the base URL using browser if `BASE_URL` is unset (defaults to `false`)
| `PORT`           | Port the server will listen on (defaults to `1443`)
| `NODE_ENV`       | Run in `development` mode (unsafe) or `production` mode (the default)
| `SEND_FOOTER_DMCA_URL` | A URL to a contact page for DMCA requests (empty / not shown by default)
| `SENTRY_CLIENT`, `SENTRY_DSN`  | Sentry Client ID and DSN for error tracking (optional, disabled by default)

*Note: more options can be found here: https://github.com/timvisee/send/blob/master/server/config.js*

#### Upload and Download Limits

Configure the limits for uploads and downloads. Long expiration times are risky on public servers as people may use you as free hosting for copyrighted content or malware (which is why Mozilla shut down their `send` service). It's advised to only expose your service on a LAN/intranet, password protect it with a proxy/gateway, or make sure to set `SEND_FOOTER_DMCA_URL` above so you can respond to takedown requests.

| Name    | Description |
|------------------|-------------|
| `MAX_FILE_SIZE` | Maximum upload file size in bytes (defaults to `2147483648` aka 2GB)
| `MAX_FILES_PER_ARCHIVE` | Maximum number of files per archive (defaults to `64`)
| `MAX_EXPIRE_SECONDS` | Maximum upload expiry time in seconds (defaults to `604800` aka 7 days)
| `MAX_DOWNLOADS` | Maximum number of downloads (defaults to `100`)
| `DOWNLOAD_COUNTS` | Download limit options to show in UI dropdown, e.g. `10,1,2,5,10,15,25,50,100,1000`
| `EXPIRE_TIMES_SECONDS` | Expire time options to show in UI dropdown, e.g. `3600,86400,604800,2592000,31536000`
| `DEFAULT_DOWNLOADS` | Default download limit in UI (defaults to `1`)
| `DEFAULT_EXPIRE_SECONDS` | Default expire time in UI (defaults to `86400`)

*Note: more options can be found here: https://github.com/timvisee/send/blob/master/server/config.js*

#### Storage Backend Options

Pick how you want to store uploaded files and set these config options accordingly:

- Local filesystem (the default): set `FILE_DIR` to the local path used inside the container for storage (or leave the default)
- S3-compatible object store: set `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (and `S3_ENDPOINT` if using something other than AWS)
- Google Cloud Storage: set `GCS_BUCKET` to the name of a GCS bucket (auth should be set up using [Application Default Credentials](https://cloud.google.com/docs/authentication/production#auth-cloud-implicit-nodejs))

Redis is used as the metadata database for the backend and is required no matter which storage method you use.

| Name  | Description |
|------------------|-------------|
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD`, `REDIS_DB` | Host name, port, and pass of the Redis server (defaults to `localhost`, `6379`, and no password)
| `FILE_DIR`       | Directory for storage inside the Docker container (defaults to `/uploads`)
| `S3_BUCKET`  | The S3 bucket name to use (only set if using S3 for storage)
| `S3_ENDPOINT` | An optional custom endpoint to use for S3 (defaults to AWS)
| `S3_USE_PATH_STYLE_ENDPOINT`| Whether to force [path style URLs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#s3ForcePathStyle-property) for S3 objects (defaults to `false`)
| `AWS_ACCESS_KEY_ID` | S3 access key ID (only set if using S3 for storage)
| `AWS_SECRET_ACCESS_KEY` | S3 secret access key ID (only set if using S3 for storage)
| `GCS_BUCKET` | Google Cloud Storage bucket (only set if using GCP for storage)

*Note: more options can be found here: https://github.com/timvisee/send/blob/master/server/config.js*

## Branding

To change the look the colors aswell as some graphics can be changed via environment variables.  
See the table below for the variables and their default values.

| Name | Default | Description |
|---|---|---|
| UI_COLOR_PRIMARY | #0a84ff | The primary color |
| UI_COLOR_ACCENT | #003eaa | The accent color (eg. for hover-effects) |
| UI_CUSTOM_ASSETS_ANDROID_CHROME_192PX | | A custom icon for Android (192x192px) |
| UI_CUSTOM_ASSETS_ANDROID_CHROME_512PX | | A custom icon for Android (512x512px) |
| UI_CUSTOM_ASSETS_APPLE_TOUCH_ICON | | A custom icon for Apple |
| UI_CUSTOM_ASSETS_FAVICON_16PX | | A custom favicon (16x16px) |
| UI_CUSTOM_ASSETS_FAVICON_32PX | | A custom favicon (32x32px) |
| UI_CUSTOM_ASSETS_ICON | | A custom icon (Logo on the top-left of the UI) |
| UI_CUSTOM_ASSETS_SAFARI_PINNED_TAB | | A custom icon for Safari |
| UI_CUSTOM_ASSETS_FACEBOOK | | A custom header image for Facebook |
| UI_CUSTOM_ASSETS_TWITTER | | A custom header image for Twitter |
| UI_CUSTOM_ASSETS_WORDMARK | | A custom wordmark (Text next to the logo) |
| UI_CUSTOM_CSS | | Allows you to define a custom CSS file for custom styling |
| CUSTOM_FOOTER_TEXT | | Allows you to define a custom footer |
| CUSTOM_FOOTER_URL | | Allows you to define a custom URL in your footer |

Side note: If you define a custom URL and a custom footer, only the footer text will display, but will be hyperlinked to the URL.

## Security Audits:

- [Internet.nl](https://internet.nl/site/send.whateveritworks.org/2060148/)
- [HSTS Preload](https://hstspreload.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=send.whateveritworks.org)
- [Security Headers](https://securityheaders.com/?q=send.whateveritworks.org&hide=on&followRedirects=on)
- [pagespeed](https://pagespeed.web.dev/)
- [webbkoll](https://webbkoll.dataskydd.net/en)
- [ImmuniWeb](https://www.immuniweb.com/ssl/send.whateveritworks.org/uLlrAeMb/)
- [Hardenize](https://www.hardenize.com/report/send.whateveritworks.org/1686343966)
- [Mozilla.org](https://observatory.mozilla.org/)
- [report-uri.com](https://report-uri.com/home/tools)
- [check-your-website.server-daten.de](https://check-your-website.server-daten.de/?q=search.whateveritworks.org)
- [csp-evaluator.withgoogle.com](https://csp-evaluator.withgoogle.com/)
- [OpenWPM](https://github.com/openwpm/OpenWPM)
- [privacyscore.org](https://privacyscore.org/site/215029/)

## Instances

- [Instances](#instances)
- [Live Status](#live-status)
- [How to use](#how-to-use-cli)
- [Host your own instance](#deploy-with-docker)
- [Security Audits](#security-audits)
- [Submit changes](#submit-changes)
- [DMCA Takedown Process Request](#dmca-takedown-process-request)

This page does not give any promises or warranties with regard to instance
security and reliability.

Instance URL | Size<br>limit | Time<br>limit | DL<br>limit | Links/<br>Notes | Country | Version | Uptime<br>(90 days)
--- | ---: | ---: | ---: | --- | ---: | --- | ---
https://send.vis.ee | 2.5GiB | 3 days | 10 | [maintainer](https://github.com/timvisee), [contact](https://timvisee.com/contact) | Netherlands 🇳🇱 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.vis.ee/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230691-8f60854620eb9d40dae7461e)
https://send.zcyph.cc | 10GiB | 7 days | 100 | [maintainer](https://github.com/zcyph), [contact](mailto:send@zcyph.cc) | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.zcyph.cc/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230695-ef83cfab5f4970c4487ad484)
https://send.ephemeral.land | 8GiB | 28 days | 1,000 | | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.ephemeral.land/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230698-d0fc0e9c893bdb81295c3ae2)
https://send.mni.li | 8GiB | 7 days | 25 | [contact](https://cryptpad.fr/form/#/2/form/view/gj2mDNekg5gf+AKPkTqLGY9W2Fa2rjceLFISeeLZa3Y/) | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.mni.li/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230704-256d7241d3fc3712ed74671c)
https://send.monks.tools | 5GiB | 7 days | 50 | | United States 🇺🇸 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.monks.tools/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230706-152180f0f00c3516167167fd)
https://send.boblorange.net | 2.5GiB | 7 days | 100 | | Portugal 🇵🇹 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.boblorange.net/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230709-6647754935bde8c9e48f74b0)
https://send.aurorabilisim.com | 2.5GiB | 7 days | 100 | [contact](https://www.aurorabilisim.com/iletisim/) | Turkey 🇹🇷 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.aurorabilisim.com/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230712-50b203eb6aba33e7ed9f35a4)
https://send.artemislena.eu | 2.5GiB | 7 days | 100 | [contact](https://artemislena.eu/contact.html) | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.artemislena.eu/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230717-7d15b7ccd3aa5630bba41a8a)
https://send.datahoarder.dev | 1GiB | 1 day | 5 | [maintainer](https://github.com/whalehub), [contact](mailto:admin@datahoarder.dev) | Luxembourg 🇱🇺 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.datahoarder.dev/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230721-b9f403d93360e8d40a50128d)
https://fileupload.ggc-project.de | 2.5GiB | 7 days | 100 | | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://fileupload.ggc-project.de/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230727-a652ecfbd4604f532e0ff48c)
https://drop.chapril.org | 1GiB | 5 days | 100 | [contact](https://www.chapril.org/contact.html) | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://drop.chapril.org/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230729-fd070e4aa8a6601035d9425a)
https://send.jeugdhulp.be | 50MiB | 10 days | 25 | [contact](https://www.jeugdhulp.be/contact) | France 🇫🇷 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.jeugdhulp.be/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230732-350359a789fe5d02bdb5ad6d)
https://files.psu.ru | 16GiB | 7 days | 500 | no password | Russia 🇷🇺 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://files.psu.ru/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230735-2d39e5d423d54366178406da)
https://send.portailpro.net | 10GiB | 30 days | 100 | | France 🇫🇷 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.portailpro.net/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230737-577e6bfd57f73d339fd6554f)
https://transfer.acted.org | 5GiB | 14 days | 3,000 | | France 🇫🇷 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://transfer.acted.org/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230739-463fdbc2d9c115069d8db1f1)
https://send.datenpost.app | 30GiB | 7 days | 3 | [contact](mailto:info@webality.de) | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.datenpost.app/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230691-8f60854620eb9d40dae7461e)
https://send.angelic.icu | 2.5GiB | 7 days | 50 | [contact](mailto:me@angelic.icu) | Romania 🇷🇴 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.angelic.icu/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794230747-a87dcbdff5b01eb9c5f92b6c)
https://s.opnxng.com | 2.5GiB | 7 days | 25 | [contact](https://about.opnxng.com/) | Singapore 🇸🇬 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://s.opnxng.com/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794398378-baf9f42c4a7e416bc51f5ba0)
https://send.whateveritworks.org | 10GiB | 7 days | 100 | [contact](https://www.whateveritworks.org/email) | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.whateveritworks.org/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794407638-626e4c3452c6933ad106a402)
https://send.cyberjake.xyz | 10GiB | 30 days | 1000 | [contact](mailto:connect@cyberjake.xyz) | United States 🇺🇸 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.cyberjake.xyz/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794455795-2d6b721c8e5dfcc8dcdae877)
https://send.kokomo.cloud | 2.5GiB | 7 days | 100 | [maintainer](https://github.com/kokomo123), [contact](mailto:admin@kokomo.cloud) | United States 🇺🇸 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.kokomo.cloud/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794630156-5be85f191fc02e133c49732f)
https://send.adminforge.de | 8GiB | 7 days | 1,000 | | Germany 🇩🇪 | ![version](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://send.adminforge.de/__version__) | ![Uptime (90 days)](https://img.shields.io/uptimerobot/ratio/90/m794906532-6e73246019e2869040265ed5)

Users can view the historic reliability of the Send instances on [this status page](https://stats.uptimerobot.com/5917xHMX01). Click each instance on that page for more details.

If you plan to host it publicly, please consider to add it to this list.

## How to Use ```CLI```
To use a specific instance from the command line with [ffsend][ffsend], provide
the `--host URL` flag while uploading.

```
# ffsend upload to custom host
ffsend upload --host https://send.vis.ee/ test.zip
```

## Submit changes

To submit changes to this list, please open a pull request or issue.

[send]: https://github.com/timvisee/send
[ffsend]: https://github.com/timvisee/ffsend

## Live Status

See Uptime Liability Send Instances: [here](https://github.com/tdulcet/send-instances-status)

## DMCA Takedown Process Request

In cases of a DMCA notice, or other abuse yet to be determined, a file has to be removed from the service.

Files can be delisted and made inaccessible by removing their record from Redis.

Send share links contain the `id` of the file, for example `https://send.firefox.com/download/3d9d2bb9a1`

From a host with access to the Redis server run a `DEL` command with the file id.

For example:

```sh
redis-cli DEL 3d9d2bb9a1
```

Other redis-cli parameters like `-h` may also be required. See [redis-cli docs](https://redis.io/topics/rediscli) for more info.

The encrypted file resides on S3 as the same `id` under the bucket that the app was configured with as `S3_BUCKET`. The file can be managed if it has not already expired with the [AWS cli](https://docs.aws.amazon.com/cli/latest/reference/s3/index.html) or AWS web console.

## Clients

- Web: [```send```](https://github.com/timvisee/send)
- Command-line: [```ffsend```](https://github.com/timvisee/ffsend)
- Android: [```Android```](#android)
- iOS: [```iOS```](#ios)
- Thunderbird: [```FileLink Provider for Send```](https://addons.thunderbird.net/thunderbird/addon/filelink-provider-for-send/)

#### Android

The android implementation is contained in the `android` directory,
and can be viewed locally for easy testing and editing by running `ANDROID=1 npm
start` and then visiting <http://localhost:8080>. CSS and image files are
located in the `android/app/src/main/assets` directory.

#### iOS

The ios implementation is contained in the `ios` directory,
and can be viewed locally for easy testing and editing by running `IOS=1 npm
start` and then visiting <http://localhost:8080>. CSS and image files are
located in the `ios/app/src/main/assets` directory.

#### Credits

The original project by Mozilla can be found [mozilla-send](https://github.com/mozilla/send).
The [```branch-mozilla-master```](https://gitlab.com/timvisee/send/-/tree/mozilla-master) branch holds the `master` branch
as left by Mozilla.
The [```branch-send-v3```](https://gitlab.com/timvisee/send/-/tree/send-v3) branch holds the commit tree of Mozilla's last
publicly hosted version, which this fork is based on.
The [```branch-send-v4```](https://gitlab.com/timvisee/send/-/tree/send-v4) branch holds the commit tree of Mozilla's last
experimental version which was still a work in progress (featuring file
reporting, download tokens, trust warnings and FxA changes), this has
selectively been merged into this fork.
Please consider to [donate](https://timvisee.com/donate) to allow me to keep working on this.

Thanks [Mozilla](https://mozilla.org) for building this amazing tool!
