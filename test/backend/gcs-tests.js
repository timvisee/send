const assert = require('assert');
const { PassThrough } = require('stream');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const writeStream = sinon.stub();
const bucket = {
  file: () => ({ createWriteStream: writeStream })
};

const GCSStorage = proxyquire('../../server/storage/gcs', {
  '@google-cloud/storage': {
    Storage: function() {
      return { bucket: () => bucket };
    }
  }
});

describe('GCSStorage', function() {
  describe('set', function() {
    it('resolves when the upload finishes', async function() {
      const destination = new PassThrough();
      destination.resume();
      writeStream.returns(destination);
      const file = new PassThrough();
      const s = new GCSStorage({ gcs_bucket: 'foo' });
      const result = s.set('x', file);
      file.end('hello');
      await result;
    });

    it('rejects and stops the upload when the source stream errors', async function() {
      const destination = new PassThrough();
      writeStream.returns(destination);
      const file = new PassThrough();
      const s = new GCSStorage({ gcs_bucket: 'foo' });
      const result = s.set('x', file);
      const err = new Error('Upload cancelled');
      file.destroy(err);
      await assert.rejects(result, err);
      assert.ok(destination.destroyed);
    });
  });
});
