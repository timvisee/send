const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

class AzBlobStorage {
  constructor(config, log) {
    const blobClient = new BlobServiceClient(
      config.az_storage_url,
      new DefaultAzureCredential()
    );
    this.container = blobClient.getContainerClient(config.az_storage_container);
    this.log = log;
  }

  async length(id) {
    const props = await this.container.getBlockBlobClient(id).getProperties();
    return props.contentLength;
  }

  async getStream(id) {
    const dl = await this.container.getBlockBlobClient(id).download();
    return dl.readableStreamBody;
  }

  set(id, file) {
    return this.container.getBlockBlobClient(id).uploadStream(file);
  }

  del(id) {
    return this.container.getBlockBlobClient(id).delete();
  }

  ping() {
    return this.container.exists();
  }
}

module.exports = AzBlobStorage;
