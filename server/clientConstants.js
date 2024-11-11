const config = require('./config');

module.exports = {
  LIMITS: {
    MAX_FILE_SIZE: config.max_file_size,
    MAX_DOWNLOADS: config.max_downloads,
    MAX_EXPIRE_SECONDS: config.max_expire_seconds,
    MAX_FILES_PER_ARCHIVE: config.max_files_per_archive,
    MAX_ARCHIVES_PER_USER: config.max_archives_per_user
  },
  WEB_UI: {
    FOOTER_DONATE_URL: config.footer_donate_url,
    FOOTER_CLI_URL: config.footer_cli_url,
    FOOTER_DMCA_URL: config.footer_dmca_url,
    FOOTER_SOURCE_URL: config.footer_source_url,
    CUSTOM_FOOTER_TEXT: config.custom_footer_text,
    CUSTOM_FOOTER_URL: config.custom_footer_url,
    COLORS: {
      PRIMARY: config.ui_color_primary,
      ACCENT: config.ui_color_accent
    },
    CUSTOM_ASSETS: config.ui_custom_assets,
    SHOW_DELETE_CONFIRM: config.show_delete_confirm
  },
  DEFAULTS: {
    DOWNLOADS: config.default_downloads,
    DOWNLOAD_COUNTS: config.download_counts,
    EXPIRE_TIMES_SECONDS: config.expire_times_seconds,
    EXPIRE_SECONDS: config.default_expire_seconds
  }
};
