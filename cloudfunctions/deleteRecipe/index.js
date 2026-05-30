const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const db = cloud.database();
  await db.collection('recipes').doc(id).remove();
  return { code: 0, msg: 'ok' };
};
