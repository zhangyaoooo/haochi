const { call } = require('../../utils/api');

Page({
  data: {
    todayOrders: [],
    tomorrowOrders: [],
    todayDate: '',
    tomorrowDate: '',
    currentOpenid: ''
  },

  onShow() {
    const openid = wx.getStorageSync('openid');
    this.setData({ currentOpenid: openid || '' });
    this.loadOrders();
  },

  loadOrders() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    this.setData({ todayDate: todayStr, tomorrowDate: tomorrowStr });

    Promise.all([
      call('getTodayOrders', { date: todayStr }),
      call('getTodayOrders', { date: tomorrowStr })
    ]).then(([todayRes, tomorrowRes]) => {
      this.setData({
        todayOrders: todayRes.code === 0 ? todayRes.data : [],
        tomorrowOrders: tomorrowRes.code === 0 ? tomorrowRes.data : []
      });
    });
  },

  onRefresh() {
    this.loadOrders();
  }
});
