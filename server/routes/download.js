const storage = require('../storage');

module.exports = async function(req, res) {
  const id = req.params.id;
  try {
    const metadata = await storage.metadata(id).metadata;
    const contentType =
      metadata && metadata.contentType
        ? metadata.contentType
        : 'application/octet-stream';

    const { length, stream } = await storage.get(id);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': length
    });
    stream.pipe(res);
  } catch (e) {
    res.sendStatus(404);
  }
};
