App({
  onLaunch() {
    wx.cloud.init({
      env: '{{YOUR_ENV_ID}}',
      traceUser: true
    });
  },

  onShow() {
    if (!this.checkLogin()) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  checkLogin() {
    return !!wx.getStorageSync('isLoggedIn');
  },

  setLoginState() {
    wx.setStorageSync('isLoggedIn', true);
  }
});
