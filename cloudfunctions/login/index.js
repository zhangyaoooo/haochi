const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const FAMILY_PASSWORD = '33066';

exports.main = async (event) => {
  const { password } = event;
  const { OPENID } = cloud.getWXContext();

  if (password !== FAMILY_PASSWORD) {
    return { code: -1, msg: '密码不对，再试试' };
  }

  const db = cloud.database();
  const exist = await db.collection('users').where({ openid: OPENID }).get();

  if (exist.data.length === 0) {
    await db.collection('users').add({
      data: {
        openid: OPENID,
        createdAt: db.serverDate()
      }
    });
  }

  return { code: 0, msg: 'ok' };
};
