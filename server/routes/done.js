const storage = require('../storage');

module.exports = async function(req, res) {
  try {
    const id = req.params.id;
    const meta = req.meta;
    await storage.incrementField(id, 'dl');
    if (meta.dlToken >= meta.dlimit) {
      await storage.kill(id);
    }
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(404);
  }
};
