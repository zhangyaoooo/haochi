const { call } = require('../../utils/api');

Page({
  data: {
    userInfo: {},
    myOrders: [],
    myClaims: [],
    tabIndex: 0
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    Promise.all([
      call('getMyOrders', { type: 'ordered' }),
      call('getMyOrders', { type: 'claimed' })
    ]).then(([ordersRes, claimsRes]) => {
      this.setData({
        myOrders: ordersRes.code === 0 ? ordersRes.data : [],
        myClaims: claimsRes.code === 0 ? claimsRes.data : []
      });
    });
  },

  onSwitchTab(e) {
    this.setData({ tabIndex: Number(e.currentTarget.dataset.index) });
  },

  onRate(e) {
    const { id } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
      success: (res) => {
        const rating = res.tapIndex + 1;
        wx.showModal({
          title: '写点评价（可选）',
          editable: true,
          placeholderText: '好吃！...',
          success: (modalRes) => {
            if (modalRes.confirm) {
              call('rateOrder', { id, rating, feedback: modalRes.content || '' }).then(r => {
                if (r.code === 0) {
                  wx.showToast({ title: '评价成功', icon: 'success' });
                  this.loadData();
                }
              });
            }
          }
        });
      }
    });
  },

  onCancel(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '取消点单',
      content: '确定取消吗？',
      success: (res) => {
        if (res.confirm) {
          call('cancelOrder', { id }).then(r => {
            if (r.code === 0) {
              wx.showToast({ title: '已取消', icon: 'none' });
              this.loadData();
            }
          });
        }
      }
    });
  },

  onHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  onLogout() {
    wx.showModal({
      title: '退出',
      content: '退出后需要重新输入密码',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('isLoggedIn');
          wx.removeStorageSync('openid');
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});
