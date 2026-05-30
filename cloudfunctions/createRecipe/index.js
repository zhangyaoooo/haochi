const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { name, category, ingredients, steps, cookingTime, difficulty, imageUrl } = event;
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();

  const result = await db.collection('recipes').add({
    data: {
      name,
      category,
      ingredients: ingredients || [],
      steps: steps || [],
      cookingTime: cookingTime || 0,
      difficulty: difficulty || 'medium',
      imageUrl: imageUrl || '',
      createdBy: OPENID,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  });

  return { code: 0, data: { _id: result._id } };
};
