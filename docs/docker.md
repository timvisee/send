## Docker Quickstart

Use `registry.gitlab.com/timvisee/send:latest` from [`timvisee/send`'s Gitlab image registry](https://gitlab.com/timvisee/send/container_registry) for the latest Docker image.

```bash
docker pull registry.gitlab.com/timvisee/send:latest

# example quickstart (point REDIS_HOST to an already-running redis server)
docker run -v $PWD/uploads:/uploads -p 1443:1443 \
    -e 'DETECT_BASE_URL=true' \
    -e 'REDIS_HOST=localhost' \
    registry.gitlab.com/timvisee/send:latest
```

Or clone this repo and run `docker build -t send:latest .` to build an image locally.

*Note: for Docker Compose, see: https://github.com/timvisee/send-docker-compose*

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

| Name                                                                   | Description |
|------------------------------------------------------------------------|-------------|
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD`, `REDIS_DB` | Host name, port, and pass of the Redis server (defaults to `localhost`, `6379`, and no password)
| `FILE_DIR`                                                             | Directory for storage inside the Docker container (defaults to `/uploads`)
| `S3_BUCKET`                                                            | The S3 bucket name to use (only set if using S3 for storage)
| `S3_ENDPOINT`                                                          | An optional custom endpoint to use for S3 (defaults to AWS)
| `S3_USE_PATH_STYLE_ENDPOINT`                                           | Whether to force [path style URLs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#s3ForcePathStyle-property) for S3 objects (defaults to `false`)
| `AWS_ACCESS_KEY_ID`                                                    | S3 access key ID (only set if using S3 for storage)
| `AWS_SECRET_ACCESS_KEY`                                                | S3 secret access key ID (only set if using S3 for storage)
| `GCS_BUCKET`                                                           | Google Cloud Storage bucket (only set if using GCP for storage)
| `AZ_STORAGE_URL`                                                       | Azure storage account URL (only set if using Azure for storage)
| `AZ_STORAGE_CONTAINER`                                                 | Azure storage account container name (only set if using Azure for storage)


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

## Examples

**Run using an Amazon Elasticache for the Redis DB, Amazon S3 for the storage backend, and Sentry for error reporting.**

```bash
$ docker run -p 1443:1443 \
  -e 'S3_BUCKET=testpilot-p2p-dev' \
  -e 'REDIS_HOST=dyf9s2r4vo3.bolxr4.0001.usw2.cache.amazonaws.com' \
  -e 'SENTRY_CLIENT=https://51e23d7263e348a7a3b90a5357c61cb2@sentry.prod.mozaws.net/168' \
  -e 'SENTRY_DSN=https://51e23d7263e348a7a3b90a5357c61cb2:65e23d7263e348a7a3b90a5357c61c44@sentry.prod.mozaws.net/168' \
  -e 'BASE_URL=https://send.example.com' \
  registry.gitlab.com/timvisee/send:latest
```

*Note: make sure to replace the example values above with your real values before running.*


**Run totally self-hosted using the current filesystem directry (`$PWD`) to store the Redis data and file uploads, with a `5GB` upload limit, 1 month expiry, and contact URL set.**

```bash
# create a network for the send backend and redis containers to talk to each other
$ docker network create timviseesend

# start the redis container
$ docker run --net=timviseesend -v $PWD/redis:/data redis-server --appendonly yes

# start the send backend container
$ docker run --net=timviseesend -v $PWD/uploads:/uploads -p 1443:1443 \
    -e 'BASE_URL=http://localhost:1443' \
    -e 'MAX_FILE_SIZE=5368709120' \
    -e 'MAX_EXPIRE_SECONDS=2592000' \
    -e 'SEND_FOOTER_DMCA_URL=https://example.com/dmca-contact-info' \
    registry.gitlab.com/timvisee/send:latest
```
Then open http://localhost:1443 to view the UI. (change the `localhost` to your IP or hostname above to serve the UI to others)

To run with HTTPS, you will need to set up a reverse proxy with SSL termination in front of the backend. See Docker Compose below for an example setup.


**Run with custom branding.**

```bash
$ docker run -p 1443:1443 \
    -v $PWD/custom_assets:/app/dist/custom_assets \
    -e 'UI_COLOR_PRIMARY=#f00' \
    -e 'UI_COLOR_ACCENT=#a00' \
    -e 'UI_CUSTOM_ASSETS_ICON=custom_assets/logo.svg' \
    registry.gitlab.com/timvisee/send:latest
```

## Docker Compose

For a Docker compose configuration example, see:

https://github.com/timvisee/send-docker-compose
