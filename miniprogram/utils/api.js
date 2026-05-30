const db = wx.cloud.database();

function call(name, data = {}) {
  return wx.cloud.callFunction({ name, data }).then(res => res.result);
}

function getCollection(name) {
  return db.collection(name);
}

module.exports = { call, getCollection };
