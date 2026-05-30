const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { category = '', keyword = '', page = 1, pageSize = 20 } = event;
  const skip = (page - 1) * pageSize;

  let where = {};
  if (category) {
    where.category = category;
  }
  if (keyword) {
    where.name = db.RegExp({ regexp: keyword, options: 'i' });
  }
  if (category && keyword) {
    where = _.and([{ category }, { name: db.RegExp({ regexp: keyword, options: 'i' }) }]);
  }

  const result = await db.collection('recipes')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get();

  return { code: 0, data: result.data };
};
