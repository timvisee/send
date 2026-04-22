import { blobStream, concatStream } from './streams';

function isDupe(newFile, array) {
  for (const file of array) {
    if (
      newFile.name === file.name &&
      newFile.size === file.size &&
      newFile.lastModified === file.lastModified
    ) {
      return true;
    }
  }
  return false;
}

export default class Archive {
  constructor(
    files = [],
    defaultTimeLimit = 86400,
    defaultDownloadLimit = 1,
    namePrefix = 'Send-Archive',
    nameTemplate = '{prefix}'
  ) {
    this.files = Array.from(files);
    this.defaultTimeLimit = defaultTimeLimit;
    this.defaultDownloadLimit = defaultDownloadLimit;
    this.timeLimit = defaultTimeLimit;
    this.dlimit = defaultDownloadLimit;
    this.password = null;
    this.namePrefix = namePrefix;
    this.nameTemplate = nameTemplate;
    this.createdAt = new Date();
  }

  get name() {
    if (this.files.length <= 1) {
      return this.files[0].name;
    }
    return this._renderArchiveName();
  }

  _renderArchiveName() {
    const pad = n => String(n).padStart(2, '0');
    const d = this.createdAt;
    const yyyy = String(d.getFullYear());
    const yy = yyyy.slice(-2);
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const date = `${yyyy}-${mm}-${dd}`;
    const datetime = `${date}-${hh}${mi}`;
    const firstName = this.files[0] ? this.files[0].name : '';
    const firstBase = firstName.replace(/\.[^./\\]+$/, '');
    const filename = firstBase.replace(/[^\w.\-]+/g, '_') || 'file';
    const tokens = {
      prefix: this.namePrefix,
      datetime,
      date,
      filename,
      yyyy,
      yy,
      mm,
      dd,
      hh,
      mi,
      ss
    };
    const rendered = (this.nameTemplate || '{prefix}').replace(
      /\{(\w+)\}/g,
      (match, key) => (key in tokens ? tokens[key] : match)
    );
    const cleaned = rendered.replace(/[/\\]+/g, '_').trim() || this.namePrefix;
    return cleaned.toLowerCase().endsWith('.zip') ? cleaned : `${cleaned}.zip`;
  }

  get type() {
    return this.files.length > 1 ? 'send-archive' : this.files[0].type;
  }

  get size() {
    return this.files.reduce((total, file) => total + file.size, 0);
  }

  get numFiles() {
    return this.files.length;
  }

  get manifest() {
    return {
      files: this.files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    };
  }

  get stream() {
    return concatStream(this.files.map(file => blobStream(file)));
  }

  addFiles(files, maxSize, maxFiles) {
    if (this.files.length + files.length > maxFiles) {
      throw new Error('tooManyFiles');
    }
    const newFiles = files.filter(
      file => file.size > 0 && !isDupe(file, this.files)
    );
    const newSize = newFiles.reduce((total, file) => total + file.size, 0);
    if (this.size + newSize > maxSize) {
      throw new Error('fileTooBig');
    }
    this.files = this.files.concat(newFiles);
    return true;
  }

  remove(file) {
    const index = this.files.indexOf(file);
    if (index > -1) {
      this.files.splice(index, 1);
    }
  }

  clear() {
    this.files = [];
    this.dlimit = this.defaultDownloadLimit;
    this.timeLimit = this.defaultTimeLimit;
    this.password = null;
    this.createdAt = new Date();
  }
}
