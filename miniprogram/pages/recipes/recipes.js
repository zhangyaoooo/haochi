const { call } = require('../../utils/api');

Page({
  data: {
    recipes: [],
    categories: ['全部', '荤菜', '素菜', '汤', '主食', '凉菜', '小吃', '其他'],
    activeCategory: '',
    keyword: '',
    page: 1,
    hasMore: true
  },

  onShow() {
    this.setData({ recipes: [], page: 1, hasMore: true });
    this.loadRecipes();
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadRecipes();
    }
  },

  loadRecipes() {
    const { activeCategory, keyword, page } = this.data;
    const category = activeCategory === '全部' ? '' : activeCategory;

    call('getRecipes', { category, keyword, page, pageSize: 20 }).then(res => {
      if (res.code === 0) {
        this.setData({
          recipes: page === 1 ? res.data : [...this.data.recipes, ...res.data],
          hasMore: res.data.length === 20,
          page: page + 1
        });
      }
    }).catch(() => {});
  },

  onCategoryTap(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({
      activeCategory: cat,
      recipes: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  onSearch(e) {
    this.setData({
      keyword: e.detail.value,
      recipes: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  onRecipeTap(e) {
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${e.detail.id}` });
  },

  onAddRecipe() {
    wx.navigateTo({ url: '/pages/recipe-form/recipe-form' });
  }
});
