'use strict'
$(document).ready(function() {

  // app はステートの様なもの。
  var app = {
    feedUrl: '',
    feedList: { urls: [], titles: [] }
  };

  // フィードリスト更新
  app.updateFeedList = function(url, title) {
    // URL未登録
    if (app.feedList.urls.indexOf(url) === -1) {
      app.feedList.urls.push(url);
      app.feedList.titles.push(title);
      app.saveFeedList();
      app.rebuildFeedMenu(url);
    }
    console.log({ feedList: app.feedList });
  }

  // フィードメニュー再構築
  app.rebuildFeedMenu = function(url) {
    $('#select-feed').empty();
    app.feedList.urls.forEach(function(v, i) {
      var title = app.feedList.titles[i];
      $('#select-feed').append(
        $('<option>').val(v).html(title)
      ).val(url);
    });
  }

  // フィードリストのローカルストレージ保存
  app.saveFeedList = function() {
    var feedList = JSON.stringify(app.feedList);
    localStorage.feedList = feedList;
  }

  // フィードコンテンツ更新
  app.updateFeedDsiplay = function(url, results) {
    if (results.RDF) {
      results = results.RDF;
    } else if (results.rss) {
      results = results.rss;
    }

    var tLink = results.channel.link;
    if (typeof tLink !== 'string') {
      tLink = tLink[0];
    }

    // リンクと見出しの埋め込み。
    var content = $('#content')
      .empty()
      .append($('<a>', {
        href: tLink,
        target: '_blank'
      }).append($('<h1>').html(results.channel.title)))
      .append($('<hr>'));

    // プルダウン更新
    app.updateFeedList(url, results.channel.title);

    // 記事の埋め込み。
    var items = results.item;
    if (!items && results.channel.item) {
      items = results.channel.item;
    }

    items.map(function(item) {
      var article = $('<a>', {
        href: item.link,
        target: '_blank'
      }).append($('<h3>').html(item.title));

      // コンテンツに追加
      content.append(article);
      
      // 説明文あり
      if (item.description) {
        var desc = $(item.description);
        var pText = item.description;
        desc.filter('p').each(function(i) {
          if (i === 0) {
            pText = $(this).html();
          }
        });
        content.append($('<p>').html(pText));
      }
      // 日付あり
      var d = item.date || item.pubDate;
      if (d) {
        content.append($('<p>').html(new Date(d).toLocaleString()));
      }

      // 水平線
      content.append($('<hr>'));
    });
  }

  // フィードのリロード実行。
  app.reloadFeed = function() {
    var url = app.feedUrl || '';
    var query = 'https://query.yahooapis.com/v1/public/yql?format=json&q=select * from xml where url="' + url + '"';
    
    // キャッシュが存在すれば、キャッシュの内容で画面を更新する。
    if ('caches' in window) {
      caches.match(query).then(function(response) {
        if (response) {
          response.json().then(function reloadFromCache(json) {
            var results = json.query.results;
            console.log('Loaded from cache:', results);
            app.updateFeedDsiplay(url, results);
          });
        }
      }); 
    }

    // Yahoo API
    $.ajax({
      url: query,
      type: 'GET',
      dataType: 'json'
    })
    .done(function(json) {
      console.log({response: json});
      var results = json.query.results;
      if (!results) {
        alert('RSS NOT Found！');
        return;
      }
      app.updateFeedDsiplay(url, results);
    })
    .fail(function(xhr, status, err) {
      alert('Error! ' + err + ' [' + status + ']');
    });
  }



  // リロードボタンクリックイベント
  $('#bt-reload').on('click', function() {
    // フィードのリロードを実行
    app.reloadFeed();
  });

  // セレクトボタンクリックイベント
  $('#bt-select').on('click', function() {
    // URLダイアログの表示
    $('#url-dialog').css('display', 'block');
  });

  // 閉じるボタンクリックイベント
  $('#close-dialog').on('click', function() {
    // URLダイアログを非表示
    $('#url-dialog').css('display', 'none');
  });

  // Getボタンクリックイベント
  $('#url-button').on('click', function() {
    // URLダイアログを非表示
    $('#url-dialog').css('display', 'none');
    // URL入力値を取得
    app.feedUrl = $('#url-input').val();
    app.reloadFeed();
  });

  // プルダウン変更
  $('#select-feed').on('change', function() {
    var url = $(this).val();
    $('#url-input').val(url);
  });

  // 初回起動
  if (localStorage.feedList) {
    app.feedList = JSON.parse(localStorage.feedList);
    app.feedUrl = app.feedList.urls[0];
    app.reloadFeed();
    app.rebuildFeedMenu(app.feedUrl);
  } else {
    app.feedUrl = 'http://cloud.watch.impress.co.jp/cda/rss/cloud.rdf';
    app.reloadFeed();
    app.saveFeedList();
  }
  
  // http://feeds.japan.cnet.com/rss/cnet/all.rdf

  // Service Worker register
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(function () {
        console.log('Service Worker Registered!');
      });
  }
});