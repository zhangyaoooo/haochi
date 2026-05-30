const { call } = require('../../utils/api');

Page({
  data: {
    orders: [],
    loading: true
  },

  onShow() {
    call('getHistoryOrders').then(res => {
      if (res.code === 0) {
        const grouped = {};
        res.data.forEach(order => {
          if (!grouped[order.date]) grouped[order.date] = [];
          grouped[order.date].push(order);
        });
        this.setData({ orders: res.data, grouped, loading: false });
      }
    });
  }
});
