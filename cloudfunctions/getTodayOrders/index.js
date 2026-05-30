const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { date } = event;
  const db = cloud.database();
  const result = await db.collection('orders')
    .where({ date, status: db.command.neq('cancelled') })
    .orderBy('createdAt', 'asc')
    .get();

  const grouped = {};
  result.data.forEach(order => {
    const key = order.recipeId;
    if (!grouped[key]) {
      grouped[key] = {
        recipeId: order.recipeId,
        recipeName: order.recipeName,
        orders: [],
        totalCount: 0
      };
    }
    grouped[key].orders.push(order);
    grouped[key].totalCount++;
  });

  return { code: 0, data: Object.values(grouped) };
};
