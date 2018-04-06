(function() {
  'use strict';

  var kashiInput = document.getElementById('kashi-input');
  var sesshiInput = document.getElementById('sesshi-input');

  kashiInput.addEventListener('input', function (e) {
    sesshiInput.value = ((this.value - 32) / 1.8).toFixed(2);
  });

  sesshiInput.addEventListener('input', function (e) {
    kashiInput.value = ((this.value * 1.8) + 32).toFixed(2);
  });
})();