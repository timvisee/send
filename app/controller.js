import FileReceiver from './fileReceiver';
import FileSender from './fileSender';
import copyDialog from './ui/copyDialog';
import faviconProgressbar from './ui/faviconProgressbar';
import okDialog from './ui/okDialog';
import shareDialog from './ui/shareDialog';
import signupDialog from './ui/signupDialog';
import surveyDialog from './ui/surveyDialog';
import { bytes, locale } from './utils';
import { copyToClipboard, delay, openLinksInNewTab, percent } from './utils';

export default function(state, emitter) {
  let lastRender = 0;
  let updateTitle = false;

  function render() {
    emitter.emit('render');
  }

  async function checkFiles() {
    const changes = await state.user.syncFileList();
    const rerender = changes.incoming || changes.downloadCount;
    if (rerender) {
      render();
    }
  }

  function updateProgress() {
    if (updateTitle) {
      emitter.emit('DOMTitleChange', percent(state.transfer.progressRatio));
    }
    faviconProgressbar.updateFavicon(state.transfer.progressRatio);
    render();
  }

  emitter.on('DOMContentLoaded', () => {
    document.addEventListener('blur', () => (updateTitle = true));
    document.addEventListener('focus', () => {
      updateTitle = false;
      emitter.emit('DOMTitleChange', 'Send');
      faviconProgressbar.updateFavicon(0);
    });
    checkFiles();
  });

  emitter.on('render', () => {
    lastRender = Date.now();
  });

  emitter.on('login', email => {
    state.user.login(email);
  });

  emitter.on('logout', async () => {
    await state.user.logout();
    emitter.emit('pushState', '/');
  });

  emitter.on('removeUpload', file => {
    state.archive.remove(file);
    if (state.archive.numFiles === 0) {
      state.archive.clear();
    }
    render();
  });

  emitter.on('delete', async ownedFile => {
    try {
      state.storage.remove(ownedFile.id);
      await ownedFile.del();
    } catch (e) {
      state.sentry.captureException(e);
    }
    render();
  });

  emitter.on('cancel', () => {
    state.transfer.cancel();
    faviconProgressbar.updateFavicon(0);
  });

  emitter.on('addFiles', async ({ files }) => {
    if (files.length < 1) {
      return;
    }
    const maxSize = state.user.maxSize;
    try {
      state.archive.addFiles(
        files,
        maxSize,
        state.LIMITS.MAX_FILES_PER_ARCHIVE
      );
    } catch (e) {
      state.modal = okDialog(
        state.translate(e.message, {
          size: bytes(maxSize),
          count: state.LIMITS.MAX_FILES_PER_ARCHIVE
        })
      );
    }
    render();
  });

  emitter.on('signup-cta', source => {
    const query = state.query;
    state.user.startAuthFlow(source, {
      campaign: query.utm_campaign,
      content: query.utm_content,
      medium: query.utm_medium,
      source: query.utm_source,
      term: query.utm_term
    });
    state.modal = signupDialog();
    render();
  });

  emitter.on('authenticate', async (code, oauthState) => {
    try {
      await state.user.finishLogin(code, oauthState);
      await state.user.syncFileList();
      emitter.emit('replaceState', '/');
    } catch (e) {
      emitter.emit('replaceState', '/error');
      setTimeout(render);
    }
  });

  emitter.on('upload', async () => {
    if (state.storage.files.length >= state.LIMITS.MAX_ARCHIVES_PER_USER) {
      state.modal = okDialog(
        state.translate('tooManyArchives', {
          count: state.LIMITS.MAX_ARCHIVES_PER_USER
        })
      );
      return render();
    }
    const archive = state.archive;
    const sender = new FileSender();

    sender.on('progress', updateProgress);
    sender.on('encrypting', render);
    sender.on('complete', render);
    state.transfer = sender;
    state.uploading = true;
    render();

    const links = openLinksInNewTab();
    await delay(200);
    try {
      const ownedFile = await sender.upload(archive, state.user.bearerToken);
      state.storage.totalUploads += 1;
      faviconProgressbar.updateFavicon(0);

      state.storage.addFile(ownedFile);
      // TODO integrate password into /upload request
      if (archive.password) {
        emitter.emit('password', {
          password: archive.password,
          file: ownedFile
        });
      }
      state.modal = state.capabilities.share
        ? shareDialog(ownedFile.name, ownedFile.url)
        : copyDialog(ownedFile.name, ownedFile.url);
    } catch (err) {
      if (err.message === '0') {
        //cancelled. do nothing
        render();
      } else if (err.message === '401') {
        const refreshed = await state.user.refresh();
        if (refreshed) {
          return emitter.emit('upload');
        }
        emitter.emit('pushState', '/error');
      } else {
        // eslint-disable-next-line no-console
        console.error(err);
        state.sentry.withScope(scope => {
          scope.setExtra('duration', err.duration);
          scope.setExtra('size', err.size);
          state.sentry.captureException(err);
        });
        emitter.emit('pushState', '/error');
      }
    } finally {
      openLinksInNewTab(links, false);
      archive.clear();
      state.uploading = false;
      state.transfer = null;
      await state.user.syncFileList();
      render();
    }
  });

  emitter.on('password', async ({ password, file }) => {
    try {
      state.settingPassword = true;
      render();
      await file.setPassword(password);
      state.storage.writeFile(file);
      await delay(1000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      state.passwordSetError = err;
    } finally {
      state.settingPassword = false;
    }
    render();
  });

  emitter.on('getMetadata', async () => {
    const file = state.fileInfo;

    const receiver = new FileReceiver(file);
    try {
      await receiver.getMetadata();
      state.transfer = receiver;
    } catch (e) {
      if (e.message === '401' || e.message === '404') {
        file.password = null;
        if (!file.requiresPassword) {
          return emitter.emit('pushState', '/404');
        }
      } else {
        console.error(e);
        return emitter.emit('pushState', '/error');
      }
    }

    render();
  });

  emitter.on('download', async () => {
    state.transfer.on('progress', updateProgress);
    state.transfer.on('decrypting', render);
    state.transfer.on('complete', render);
    const links = openLinksInNewTab();
    try {
      const dl = state.transfer.download({
        stream: state.capabilities.streamDownload,
        storage: state.storage
      });
      render();
      await dl;
      state.storage.totalDownloads += 1;
      faviconProgressbar.updateFavicon(0);
    } catch (err) {
      if (err.message === '0') {
        // download cancelled
        state.transfer.reset();
        render();
      } else {
        // eslint-disable-next-line no-console
        state.transfer = null;
        const location = ['404', '403'].includes(err.message)
          ? '/404'
          : '/error';
        if (location === '/error') {
          state.sentry.withScope(scope => {
            scope.setExtra('duration', err.duration);
            scope.setExtra('size', err.size);
            scope.setExtra('progress', err.progress);
            state.sentry.captureException(err);
          });
        }
        emitter.emit('pushState', location);
      }
    } finally {
      openLinksInNewTab(links, false);
    }
  });

  emitter.on('copy', ({ url }) => {
    copyToClipboard(url);
  });

  emitter.on('closeModal', () => {
    if (
      state.PREFS.surveyUrl &&
      ['copy', 'share'].includes(state.modal.type) &&
      locale().startsWith('en') &&
      (state.storage.totalUploads > 1 || state.storage.totalDownloads > 0) &&
      !state.user.surveyed
    ) {
      state.user.surveyed = true;
      state.modal = surveyDialog();
    } else {
      state.modal = null;
    }
    render();
  });

  setInterval(() => {
    // poll for updates of the upload list
    if (!state.modal && state.route === '/') {
      checkFiles();
    }
  }, 2 * 60 * 1000);

  setInterval(() => {
    // poll for rerendering the file list countdown timers
    if (
      !state.modal &&
      state.route === '/' &&
      state.storage.files.length > 0 &&
      Date.now() - lastRender > 30000
    ) {
      render();
    }
  }, 60000);
}
