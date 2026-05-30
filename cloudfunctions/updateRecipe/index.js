const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id, ...updates } = event;
  const db = cloud.database();
  await db.collection('recipes').doc(id).update({
    data: { ...updates, updatedAt: db.serverDate() }
  });
  return { code: 0, msg: 'ok' };
};
