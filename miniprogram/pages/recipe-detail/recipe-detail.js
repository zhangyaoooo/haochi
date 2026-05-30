const { call } = require('../../utils/api');

Page({
  data: {
    recipe: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    call('getRecipeDetail', { id }).then(res => {
      if (res.code === 0) {
        this.setData({ recipe: res.data, loading: false });
      }
    });
  },

  onOrder(e) {
    const { date } = e.currentTarget.dataset;
    const { recipe } = this.data;
    if (!recipe) return;

    wx.showModal({
      title: '确认点菜',
      content: `${date === 'tomorrow' ? '明天' : '今天'}吃 ${recipe.name}？`,
      success: (res) => {
        if (res.confirm) {
          const today = new Date();
          if (date === 'tomorrow') {
            today.setDate(today.getDate() + 1);
          }
          const dateStr = today.toISOString().split('T')[0];

          call('createOrder', { recipeId: recipe._id, recipeName: recipe.name, date: dateStr }).then(r => {
            if (r.code === 0) {
              wx.showToast({ title: '已点好！', icon: 'success' });
            }
          });
        }
      }
    });
  },

  onEdit() {
    const { recipe } = this.data;
    wx.navigateTo({ url: `/pages/recipe-form/recipe-form?id=${recipe._id}` });
  },

  onDelete() {
    wx.showModal({
      title: '删除菜谱',
      content: `确定要删除「${this.data.recipe.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          call('deleteRecipe', { id: this.data.recipe._id }).then(r => {
            if (r.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1500);
            }
          });
        }
      }
    });
  }
});
