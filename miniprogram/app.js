App({
  onLaunch() {
    wx.cloud.init({
      env: '{{YOUR_ENV_ID}}',
      traceUser: true
    });
  },

  checkLogin() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    return !!isLoggedIn;
  },

  setLoginState() {
    wx.setStorageSync('isLoggedIn', true);
  }
});
