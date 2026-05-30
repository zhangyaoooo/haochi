const { call } = require('../../utils/api');

Component({
  properties: {
    group: { type: Object, value: {} },
    currentOpenid: { type: String, value: '' }
  },
  methods: {
    onClaim() {
      const order = this.data.group.orders.find(o => o.status === 'ordered');
      if (!order) return;

      wx.showModal({
        title: '认领烹饪',
        content: `你要做「${this.data.group.recipeName}」吗？`,
        success: (res) => {
          if (res.confirm) {
            call('claimOrder', { id: order._id }).then(r => {
              if (r.code === 0) {
                wx.showToast({ title: '已认领！', icon: 'success' });
                this.triggerEvent('refresh');
              } else {
                wx.showToast({ title: r.msg, icon: 'none' });
              }
            });
          }
        }
      });
    },

    onComplete() {
      const order = this.data.group.orders.find(o => o.status === 'claimed' && o.claimedBy === this.data.currentOpenid);
      if (!order) return;

      call('completeOrder', { id: order._id }).then(r => {
        if (r.code === 0) {
          wx.showToast({ title: '做好了！', icon: 'success' });
          this.triggerEvent('refresh');
        }
      });
    },

    onUnclaim() {
      const order = this.data.group.orders.find(o => o.status === 'claimed' && o.claimedBy === this.data.currentOpenid);
      if (!order) return;

      call('unclaimOrder', { id: order._id }).then(r => {
        if (r.code === 0) {
          wx.showToast({ title: '已放弃认领', icon: 'none' });
          this.triggerEvent('refresh');
        }
      });
    }
  }
});
