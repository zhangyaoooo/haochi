const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { type } = event;
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const field = type === 'ordered' ? 'orderedBy' : 'claimedBy';

  const result = await db.collection('orders')
    .where({ [field]: OPENID, status: db.command.neq('cancelled') })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return { code: 0, data: result.data };
};
