import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | application');

test('visiting a page with a node-sourced library', function(assert) {
  visit('/');

  andThen(() => {
    assert.equal(currentURL(), '/');

    assert.equal(find('.slick-slide.slick-active').length, 3);
    assert.equal(find('.slick-prev, .slick-next').length, 2);
  });
});

test('fetching public assets', function(assert) {
  let ajax = this.application.__container__.lookup('service:ajax');

  // If the request succeeds, we're good
  return ajax.request('/assets/fonts/slick.woff', { method: 'HEAD' })
    .then(() => assert.ok(true))
    .catch((error) => {
      window.console.log(error);
      assert.ok(false);
    });
});
