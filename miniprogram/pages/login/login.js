const { call } = require('../../utils/api');
const app = getApp();

Page({
  data: {
    password: '',
    error: ''
  },

  onInput(e) {
    this.setData({ password: e.detail.value, error: '' });
  },

  onSubmit() {
    const { password } = this.data;
    if (!password.trim()) return;

    wx.showLoading({ title: '验证中...' });

    call('login', { password }).then(res => {
      if (res.code !== 0) {
        wx.hideLoading();
        this.setData({ error: res.msg });
        return;
      }

      wx.setStorageSync('openid', res.openid);
      wx.hideLoading();
      app.setLoginState();
      wx.switchTab({ url: '/pages/recipes/recipes' });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    });
  }
});
