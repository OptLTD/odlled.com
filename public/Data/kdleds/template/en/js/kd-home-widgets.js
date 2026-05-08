/**
 * 首页 / 含同款 DOM 的页面：首屏轮播（jslides）、Products 走马灯（kxbdSuperMarquee）、Cases 横滚（myScroll）。
 * 依赖：jquery、Marquee.js、show/myScroll.js（先于本文件加载）
 */
;(function (global) {
  var $ = global.jQuery
  if (!$) return

  function clearJslides() {
    if (global.__kdJslidesTT) {
      clearTimeout(global.__kdJslidesTT)
      global.__kdJslidesTT = null
    }
    $('#pagination').remove()
  }

  function initJslides() {
    clearJslides()
    var $slides = $('#slides')
    if (!$slides.length || !$slides.children('li').length) return

    var numpic = $slides.children('li').length - 1
    var nownow = 0
    var inout = 0
    var SPEED = 5000

    $slides.children('li').eq(0).siblings('li').css({ display: 'none' })

    var ulcontent = ''
    for (var i = 0; i <= numpic; i++) {
      ulcontent += '<li><a href=\"#\">' + (i + 1) + '</a></li>'
    }
    $slides.after('<ul id=\"pagination\">' + ulcontent + '</ul>')

    var pagination = $('#pagination li')
    var paginationwidth = $('#pagination').width()
    $('#pagination').css('margin-left', 470 - paginationwidth)
    pagination.eq(0).addClass('current')

    pagination.on('click', function () {
      var changenow = $(this).index()
      $('#slides li').eq(nownow).css('z-index', '2')
      $('#slides li').eq(changenow).css({ 'z-index': '1' }).show()
      pagination.eq(changenow).addClass('current').siblings('li').removeClass('current')
      $('#slides li')
        .eq(nownow)
        .fadeOut(400, function () {
          $('#slides li').eq(changenow).fadeIn(500)
        })
      nownow = changenow
    })

    pagination.mouseenter(function () {
      inout = 1
    })
    pagination.mouseleave(function () {
      inout = 0
    })

    function GOGO() {
      var NN = nownow + 1
      if (inout !== 1) {
        if (nownow < numpic) {
          $('#slides li').eq(nownow).css('z-index', '2')
          $('#slides li').eq(NN).css({ 'z-index': '1' }).show()
          pagination.eq(NN).addClass('current').siblings('li').removeClass('current')
          $('#slides li')
            .eq(nownow)
            .fadeOut(400, function () {
              $('#slides li').eq(NN).fadeIn(500)
            })
          nownow += 1
        } else {
          NN = 0
          $('#slides li').eq(nownow).css('z-index', '2')
          $('#slides li').eq(NN).stop(true, true).css({ 'z-index': '1' }).show()
          $('#slides li')
            .eq(nownow)
            .fadeOut(400, function () {
              $('#slides li').eq(0).fadeIn(500)
            })
          pagination.eq(NN).addClass('current').siblings('li').removeClass('current')
          nownow = 0
        }
      }
      global.__kdJslidesTT = setTimeout(GOGO, SPEED)
    }

    global.__kdJslidesTT = setTimeout(GOGO, SPEED)
  }

  function initMarquee() {
    var mq = $('#marquee1')
    if (!mq.length || typeof mq.kxbdSuperMarquee !== 'function') return
    mq.kxbdSuperMarquee({
      distance: 600,
      time: 3,
      btnGo: { left: '#goL', right: '#goR' },
      direction: 'left',
    })
  }

  function initCasesScroll() {
    if (typeof global.myScroll !== 'function') return
    var el = document.getElementById('ISL_Cont_1')
    if (!el) return
    global.__kdStopCasesScroll?.()
    var ids = []
    var origSetInterval = global.setInterval
    global.setInterval = function (fn, t) {
      var id = origSetInterval.call(global, fn, t)
      ids.push(id)
      return id
    }
    try {
      global.myScroll('ISL_Cont_1', 'List1_1', 'List2_1', 'LeftBotton', 'RightBotton', 10, 10, 600, 0, 5000)
    } catch (e) {
      console.warn('myScroll', e)
    } finally {
      global.setInterval = origSetInterval
      global.__kdStopCasesScroll = function () {
        ids.forEach(function (id) {
          clearInterval(id)
        })
        global.__kdStopCasesScroll = null
      }
    }
  }

  global.kdTeardownLegacyWidgets = function () {
    clearJslides()
    if (typeof global.__kdStopCasesScroll === 'function') global.__kdStopCasesScroll()
  }

  global.kdInitLegacyWidgets = function () {
    global.kdTeardownLegacyWidgets()
    initJslides()
    initMarquee()
    initCasesScroll()
  }
})(typeof window !== 'undefined' ? window : this)

/**
 * map.html：正文 JSON 已剔除脚本，在此按需初始化地图。
 * - 若 window.__KD_BAIDU_MAP_AK__ 非空（Vite 注入 VITE_BAIDU_MAP_AK）：百度 JS API 3.0
 * - 否则：Leaflet + OpenStreetMap（免密钥，国内访问依赖网络环境）
 */
;(function (global) {
  var BAIDU_SCRIPT_ID = 'kd-baidu-map-api-v3'
  var LEAFLET_CSS_ID = 'kd-leaflet-css'
  var LEAFLET_JS_ID = 'kd-leaflet-js'

  function mapAk() {
    var ak = global.__KD_BAIDU_MAP_AK__
    return typeof ak === 'string' && ak.replace(/\s/g, '') !== '' ? ak : ''
  }

  function teardownMapLegacy() {
    var el = document.getElementById('dituContent')
    try {
      if (global.__kdLeafletMap) {
        global.__kdLeafletMap.remove()
      }
    } catch (e) {
      /* ignore */
    }
    global.__kdLeafletMap = undefined
    try {
      if (global.map && typeof global.map.dispose === 'function') {
        global.map.dispose()
      }
    } catch (e2) {
      /* ignore */
    }
    global.map = undefined
    if (el) {
      el.removeAttribute('data-kd-bmap-inited')
      el.innerHTML = ''
    }
  }

  function loadBaiduApiV3(done) {
    if (global.BMap) {
      done()
      return
    }
    var ak = mapAk()
    if (!ak) {
      done(new Error('no Baidu AK'))
      return
    }
    if (document.getElementById(BAIDU_SCRIPT_ID)) {
      var left = 200
      var iv = global.setInterval(function () {
        left--
        if (global.BMap) {
          global.clearInterval(iv)
          done()
        } else if (left <= 0) {
          global.clearInterval(iv)
          done(new Error('Baidu API timeout'))
        }
      }, 50)
      return
    }
    var cbName = '__kdBmapCb_' + Date.now()
    var cbDone = false
    var to = global.setTimeout(function () {
      if (cbDone || global.BMap) return
      cbDone = true
      try {
        delete global[cbName]
      } catch (e) {
        global[cbName] = undefined
      }
      done(new Error('Baidu API callback timeout'))
    }, 12000)
    global[cbName] = function () {
      if (cbDone) return
      cbDone = true
      global.clearTimeout(to)
      try {
        delete global[cbName]
      } catch (e) {
        global[cbName] = undefined
      }
      done()
    }
    var s = document.createElement('script')
    s.id = BAIDU_SCRIPT_ID
    s.async = true
    s.src =
      'https://api.map.baidu.com/api?v=3.0&ak=' +
      encodeURIComponent(ak) +
      '&callback=' +
      cbName
    s.onerror = function () {
      if (cbDone) return
      cbDone = true
      global.clearTimeout(to)
      try {
        delete global[cbName]
      } catch (e2) {
        global[cbName] = undefined
      }
      done(new Error('Baidu script load error'))
    }
    document.head.appendChild(s)
  }

  function loadLeaflet(done) {
    if (global.L) {
      done()
      return
    }
    if (!document.getElementById(LEAFLET_CSS_ID)) {
      var link = document.createElement('link')
      link.id = LEAFLET_CSS_ID
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    if (document.getElementById(LEAFLET_JS_ID)) {
      var left = 200
      var iv = global.setInterval(function () {
        left--
        if (global.L) {
          global.clearInterval(iv)
          done()
        } else if (left <= 0) {
          global.clearInterval(iv)
          done(new Error('Leaflet timeout'))
        }
      }, 50)
      return
    }
    var s = document.createElement('script')
    s.id = LEAFLET_JS_ID
    s.async = true
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = function () {
      done()
    }
    s.onerror = function () {
      done(new Error('Leaflet script load error'))
    }
    document.head.appendChild(s)
  }

  function runInitBaidu() {
    var el = document.getElementById('dituContent')
    if (!global.BMap || !el || el.getAttribute('data-kd-bmap-inited') === '1') return
    el.setAttribute('data-kd-bmap-inited', '1')
    try {
      var map = new global.BMap.Map('dituContent')
      var point = new global.BMap.Point(114.066112, 22.548515)
      map.centerAndZoom(point, 12)
      global.map = map
      map.enableScrollWheelZoom(true)
      map.addControl(
        new global.BMap.NavigationControl({
          anchor: global.BMAP_ANCHOR_TOP_LEFT,
          type: global.BMAP_NAVIGATION_CONTROL_LARGE,
        }),
      )
      map.addControl(
        new global.BMap.OverviewMapControl({
          anchor: global.BMAP_ANCHOR_BOTTOM_RIGHT,
          isOpen: true,
        }),
      )
      map.addControl(new global.BMap.ScaleControl({ anchor: global.BMAP_ANCHOR_BOTTOM_LEFT }))
    } catch (e) {
      console.warn('Baidu map init', e)
      el.removeAttribute('data-kd-bmap-inited')
    }
  }

  function runInitLeaflet() {
    var el = document.getElementById('dituContent')
    if (!global.L || !el || el.getAttribute('data-kd-bmap-inited') === '1') return
    el.setAttribute('data-kd-bmap-inited', '1')
    try {
      el.innerHTML = ''
      var map = global.L.map(el).setView([22.548515, 114.066112], 12)
      global.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)
      global.__kdLeafletMap = map
    } catch (e) {
      console.warn('Leaflet map init', e)
      el.removeAttribute('data-kd-bmap-inited')
    }
  }

  function initMapLegacy() {
    var el = document.getElementById('dituContent')
    if (!el || el.getAttribute('data-kd-bmap-inited') === '1') return

    if (mapAk()) {
      loadBaiduApiV3(function (err) {
        if (err) {
          console.warn(err.message || err)
          loadLeaflet(function (e2) {
            if (e2) console.warn(e2.message || e2)
            else global.setTimeout(runInitLeaflet, 0)
          })
          return
        }
        global.setTimeout(runInitBaidu, 0)
      })
      return
    }

    loadLeaflet(function (err) {
      if (err) console.warn(err.message || err)
      else global.setTimeout(runInitLeaflet, 0)
    })
  }

  var origTeardown = global.kdTeardownLegacyWidgets
  var origInit = global.kdInitLegacyWidgets

  global.kdTeardownLegacyWidgets = function () {
    teardownMapLegacy()
    if (typeof origTeardown === 'function') origTeardown()
  }

  global.kdInitLegacyWidgets = function () {
    if (typeof origInit === 'function') origInit()
    initMapLegacy()
  }
})(typeof window !== 'undefined' ? window : this)
