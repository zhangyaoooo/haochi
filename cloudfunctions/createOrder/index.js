const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { recipeId, recipeName, date } = event;
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();

  const user = await db.collection('users').where({ openid: OPENID }).get();
  const orderedByName = user.data.length > 0 ? user.data[0].nickName : '未知';

  await db.collection('orders').add({
    data: {
      recipeId,
      recipeName,
      date,
      orderedBy: OPENID,
      orderedByName,
      status: 'ordered',
      createdAt: db.serverDate()
    }
  });

  return { code: 0, msg: 'ok' };
};
