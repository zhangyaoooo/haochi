Component({
  properties: {
    recipe: {
      type: Object,
      value: {}
    }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.recipe._id });
    }
  }
});
