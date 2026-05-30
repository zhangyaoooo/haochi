const { call } = require('../../utils/api');

Page({
  data: {
    isEdit: false,
    id: '',
    form: {
      name: '',
      category: '荤菜',
      cookingTime: 30,
      difficulty: 'medium',
      imageUrl: ''
    },
    ingredients: [{ name: '', amount: '' }],
    steps: [{ text: '' }],
    categories: ['荤菜', '素菜', '汤', '主食', '凉菜', '小吃', '其他'],
    difficulties: [
      { value: 'easy', label: '简单' },
      { value: 'medium', label: '中等' },
      { value: 'hard', label: '困难' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑菜谱' });
      this.setData({ isEdit: true, id: options.id });
      call('getRecipeDetail', { id: options.id }).then(res => {
        if (res.code === 0) {
          const r = res.data;
          this.setData({
            form: {
              name: r.name,
              category: r.category,
              cookingTime: r.cookingTime,
              difficulty: r.difficulty,
              imageUrl: r.imageUrl || ''
            },
            ingredients: r.ingredients.length > 0 ? r.ingredients : [{ name: '', amount: '' }],
            steps: r.steps.length > 0 ? r.steps : [{ text: '' }]
          });
        }
      });
    }
  },

  onCategoryChange(e) {
    this.setData({ ['form.category']: this.data.categories[e.detail.value] });
  },

  onFieldChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onFieldTap(e) {
    const { field, value } = e.currentTarget.dataset;
    this.setData({ ['form.' + field]: value });
  },

  onIngredientChange(e) {
    const { index, field } = e.currentTarget.dataset;
    this.setData({ [`ingredients[${index}].${field}`]: e.detail.value });
  },

  addIngredient() {
    this.setData({ ingredients: [...this.data.ingredients, { name: '', amount: '' }] });
  },

  removeIngredient(e) {
    const { index } = e.currentTarget.dataset;
    const arr = this.data.ingredients.filter((_, i) => i !== index);
    this.setData({ ingredients: arr.length > 0 ? arr : [{ name: '', amount: '' }] });
  },

  onStepChange(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ [`steps[${index}].text`]: e.detail.value });
  },

  addStep() {
    this.setData({ steps: [...this.data.steps, { text: '' }] });
  },

  removeStep(e) {
    const { index } = e.currentTarget.dataset;
    const arr = this.data.steps.filter((_, i) => i !== index);
    this.setData({ steps: arr.length > 0 ? arr : [{ text: '' }] });
  },

  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: (res) => {
        wx.showLoading({ title: '上传中...' });
        wx.cloud.uploadFile({
          cloudPath: `recipe-images/${Date.now()}.png`,
          filePath: res.tempFilePaths[0]
        }).then(uploadRes => {
          wx.hideLoading();
          this.setData({ ['form.imageUrl']: uploadRes.fileID });
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },

  onSubmit() {
    const { isEdit, id, form, ingredients, steps } = this.data;

    if (!form.name.trim()) {
      wx.showToast({ title: '请输入菜名', icon: 'none' });
      return;
    }

    const data = {
      ...form,
      name: form.name.trim(),
      ingredients: ingredients.filter(i => i.name.trim()),
      steps: steps.filter(s => s.text.trim()).map((s, i) => ({ text: s.text.trim() }))
    };

    const fn = isEdit ? 'updateRecipe' : 'createRecipe';
    const params = isEdit ? { id, ...data } : data;

    call(fn, params).then(res => {
      if (res.code === 0) {
        wx.showToast({ title: isEdit ? '已更新' : '已创建', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    });
  },

  onDelete() {
    if (!this.data.isEdit) return;
    wx.showModal({
      title: '删除菜谱',
      content: '确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          call('deleteRecipe', { id: this.data.id }).then(r => {
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
