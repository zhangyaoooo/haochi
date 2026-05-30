App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-d1g38sqiw142938d6',
      traceUser: true
    });
  },

  onShow() {
    if (!this.checkLogin()) {
      // Delay reLaunch to avoid "__route__ is not defined" when framework
      // fires onShow before the page stack is initialized
      try {
        wx.reLaunch({ url: '/pages/login/login' });
      } catch (e) {
        setTimeout(() => {
          try { wx.reLaunch({ url: '/pages/login/login' }); } catch (_) {}
        }, 100);
      }
    }
  },

  checkLogin() {
    return !!wx.getStorageSync('isLoggedIn');
  },

  setLoginState() {
    wx.setStorageSync('isLoggedIn', true);
  }
});
