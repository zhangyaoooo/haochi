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
      steps: '',
      imageUrl: ''
    },
    ingredients: [{ name: '', amount: '' }],
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
              imageUrl: r.imageUrl || '',
              steps: Array.isArray(r.steps) ? r.steps.map(s => s.text).join('\n') : (r.steps || '')
            },
            ingredients: r.ingredients.length > 0 ? r.ingredients : [{ name: '', amount: '' }]
          });
        }
      }).catch(() => {});
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

  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: (res) => {
        wx.showLoading({ title: '处理中...' });
        // Compress: resize long edge to 800px, quality 60
        wx.compressImage({
          src: res.tempFilePaths[0],
          compressedWidth: 800,
          compressHeight: 800,
          quality: 60,
          success: (compressRes) => {
            wx.cloud.uploadFile({
              cloudPath: `recipe-images/${Date.now()}.png`,
              filePath: compressRes.tempFilePath
            }).then(uploadRes => {
              wx.hideLoading();
              this.setData({ ['form.imageUrl']: uploadRes.fileID });
            }).catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '上传失败', icon: 'none' });
            });
          },
          fail: () => {
            wx.hideLoading();
            // Fallback: upload uncompressed
            wx.cloud.uploadFile({
              cloudPath: `recipe-images/${Date.now()}.png`,
              filePath: res.tempFilePaths[0]
            }).then(uploadRes => {
              this.setData({ ['form.imageUrl']: uploadRes.fileID });
            }).catch(() => {
              wx.showToast({ title: '上传失败', icon: 'none' });
            });
          }
        });
      }
    });
  },

  onSubmit() {
    const { isEdit, id, form, ingredients } = this.data;

    if (!form.name.trim()) {
      wx.showToast({ title: '请输入菜名', icon: 'none' });
      return;
    }

    const data = {
      ...form,
      name: form.name.trim(),
      ingredients: ingredients.filter(i => i.name.trim())
    };

    const fn = isEdit ? 'updateRecipe' : 'createRecipe';
    const params = isEdit ? { id, ...data } : data;

    call(fn, params).then(res => {
      if (res.code === 0) {
        wx.showToast({ title: isEdit ? '已更新' : '已创建', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    }).catch(() => { wx.showToast({ title: '保存失败', icon: 'none' }); });
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
          }).catch(() => { wx.showToast({ title: '删除失败', icon: 'none' }); });
        }
      }
    });
  }
});
