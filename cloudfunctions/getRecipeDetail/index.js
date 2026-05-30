const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const db = cloud.database();
  const result = await db.collection('recipes').doc(id).get();
  return { code: 0, data: result.data };
};
