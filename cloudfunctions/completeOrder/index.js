const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const db = cloud.database();
  await db.collection('orders').doc(id).update({
    data: { status: 'completed' }
  });
  return { code: 0, msg: 'ok' };
};
