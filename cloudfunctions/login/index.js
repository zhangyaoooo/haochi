const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const FAMILY_PASSWORD = '33066';

exports.main = async (event) => {
  const { password, nickName, avatarUrl } = event;
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
        nickName: nickName || '',
        avatarUrl: avatarUrl || '',
        createdAt: db.serverDate()
      }
    });
  } else {
    await db.collection('users').doc(exist.data[0]._id).update({
      data: { nickName: nickName || '', avatarUrl: avatarUrl || '' }
    });
  }

  return { code: 0, msg: 'ok', openid: OPENID };
};
