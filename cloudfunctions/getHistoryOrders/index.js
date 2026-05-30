const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const db = cloud.database();
  const result = await db.collection('orders')
    .where({ status: 'completed' })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return { code: 0, data: result.data };
};
