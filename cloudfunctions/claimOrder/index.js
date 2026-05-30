const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { id } = event;
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();

  const order = await db.collection('orders').doc(id).get();
  if (order.data.status !== 'ordered') {
    return { code: -1, msg: '这道菜已经被认领了' };
  }

  const user = await db.collection('users').where({ openid: OPENID }).get();
  const claimedByName = user.data.length > 0 ? user.data[0].nickName : '未知';

  await db.collection('orders').doc(id).update({
    data: {
      status: 'claimed',
      claimedBy: OPENID,
      claimedByName
    }
  });

  return { code: 0, msg: 'ok' };
};
