const storage = require('../storage');

module.exports = async function(req, res) {
  const id = req.params.id;
  const meta = req.meta;
  try {
    const ttl = await storage.ttl(id);
    res.send({
      metadata: meta.metadata,
      flagged: !!meta.flagged,
      finalDownload: meta.dlToken + 1 === meta.dlimit,
      ttl
    });
  } catch (e) {
    res.sendStatus(404);
  }
};
