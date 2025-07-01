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
    FOOTER_THUNDERBIRD_ADDON_URL: config.footer_thunderbird_addon_url,
    FOOTER_DMCA_URL: config.footer_dmca_url,
    FOOTER_SOURCE_URL: config.footer_source_url,
    CUSTOM_FOOTER_TEXT: config.custom_footer_text,
    CUSTOM_FOOTER_URL: config.custom_footer_url,
    MAIN_NOTICE_HTML: config.main_notice_html,
    UPLOAD_AREA_NOTICE_HTML: config.upload_area_notice_html,
    UPLOADS_LIST_NOTICE_HTML: config.uploads_list_notice_html,
    DOWNLOAD_NOTICE_HTML: config.download_notice_html,
    SHOW_THUNDERBIRD_SPONSOR: config.show_thunderbird_sponsor,
    COLORS: {
      PRIMARY: config.ui_color_primary,
      ACCENT: config.ui_color_accent
    },
    CUSTOM_ASSETS: config.ui_custom_assets
  },
  DEFAULTS: {
    DOWNLOADS: config.default_downloads,
    DOWNLOAD_COUNTS: config.download_counts,
    EXPIRE_TIMES_SECONDS: config.expire_times_seconds,
    EXPIRE_SECONDS: config.default_expire_seconds
  }
};
