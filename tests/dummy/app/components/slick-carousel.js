import Ember from 'ember';

export default Ember.Component.extend({
  didInsertElement() {
    this.$().slick({
      lazyLoad: 'ondemand',
      infinite: true,
      slidesToShow: 3,
      dots: true,
      arrows: true
    });
  },

  willDestroyElement() {
    this.$().slick('unslick');
  }
});
