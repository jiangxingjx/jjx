
/*

  Shape Shifter
  =============
  A canvas experiment by Kenneth Cachia
  http://www.kennethcachia.com

  Updated code
  ------------
  https://github.com/kennethcachia/Shape-Shifter

*/


var S = {
  init: function () {
    var action = window.location.href,
        i = action.indexOf('?a=');

    S.Drawing.init('.canvas');
    document.body.classList.add('body--ready');

    if (i !== -1) {
      S.UI.simulate(decodeURI(action).substring(i + 3));
    } else {
      S.UI.simulate('|#countdown 3||铭哥|我错了|我不该乱说话|对不起|请原谅我|#heart|');
    }

    S.Drawing.loop(function () {
      S.Shape.render();
    });
  }
};


S.Drawing = (function () {
  var canvas,
      context,
      renderFn
      requestFrame = window.requestAnimationFrame       ||
                     window.webkitRequestAnimationFrame ||
                     window.mozRequestAnimationFrame    ||
                     window.oRequestAnimationFrame      ||
                     window.msRequestAnimationFrame     ||
                     function(callback) {
                       window.setTimeout(callback, 1000 / 60);
                     };

  return {
    init: function (el) {
      canvas = document.querySelector(el);
      context = canvas.getContext('2d');
      this.adjustCanvas();

      window.addEventListener('resize', function (e) {
        S.Drawing.adjustCanvas();
      });
    },

    loop: function (fn) {
      renderFn = !renderFn ? fn : renderFn;
      this.clearFrame();
      renderFn();
      requestFrame.call(window, this.loop.bind(this));
    },

    adjustCanvas: function () {
      var dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      context.scale(dpr, dpr);
    },

    clearFrame: function () {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    },

    getArea: function () {
      return { w: window.innerWidth, h: window.innerHeight };
    },

    drawCircle: function (p, c, glow) {
      if (glow) {
        context.shadowBlur = glow;
        context.shadowColor = c.render();
      } else {
        context.shadowBlur = 0;
      }
      context.fillStyle = c.render();
      context.beginPath();
      context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
      context.closePath();
      context.fill();
      context.shadowBlur = 0;
    }
  }
}());


S.UI = (function () {
  var canvas = document.querySelector('.canvas'),
      interval,
      isTouch = false, //('ontouchstart' in window || navigator.msMaxTouchPoints),
      currentAction,
      resizeTimer,
      time,
      maxShapeSize = 30,
      firstAction = true,
      sequence = [],
      cmd = '#';

  function formatTime(date) {
    var h = date.getHours(),
        m = date.getMinutes(),
    m = m < 10 ? '0' + m : m;
    return h + ':' + m;
  }

  function getValue(value) {
    return value && value.split(' ')[1];
  }

  function getAction(value) {
    value = value && value.split(' ')[0];
    return value && value[0] === cmd && value.substring(1);
  }

  function timedAction(fn, delay, max, reverse) {
    clearInterval(interval);
    currentAction = reverse ? max : 1;
    fn(currentAction);

    if (!max || (!reverse && currentAction < max) || (reverse && currentAction > 0)) {
      interval = setInterval(function () {
        currentAction = reverse ? currentAction - 1 : currentAction + 1;
        fn(currentAction);

        if ((!reverse && max && currentAction === max) || (reverse && currentAction === 0)) {
          clearInterval(interval);
        }
      }, delay);
    }
  }

  function reset(destroy) {
    clearInterval(interval);
    sequence = [];
    time = null;
    destroy && S.Shape.switchShape(S.ShapeBuilder.letter(''));
  }

  function performAction(value) {
    var action,
        value,
        current;

    // overlay.classList.remove('overlay--visible');
    sequence = typeof(value) === 'object' ? value : sequence.concat(value.split('|'));
    // input.value = '';
    // checkInputWidth();

    timedAction(function (index) {
      current = sequence.shift();
      action = getAction(current);
      value = getValue(current);

      switch (action) {
        case 'countdown':
          value = parseInt(value) || 10;
          value = value > 0 ? value : 10;

          timedAction(function (index) {
            if (index === 0) {
              if (sequence.length === 0) {
                S.Shape.switchShape(S.ShapeBuilder.letter(''));
              } else {
                performAction(sequence);
              }
            } else {
              S.Shape.switchShape(S.ShapeBuilder.letter(index), true);
            }
          }, 1000, value, true);
          break;

        case 'rectangle':
          value = value && value.split('x');
          value = (value && value.length === 2) ? value : [maxShapeSize, maxShapeSize / 2];

          S.Shape.switchShape(S.ShapeBuilder.rectangle(Math.min(maxShapeSize, parseInt(value[0])), Math.min(maxShapeSize, parseInt(value[1]))));
          break;

        case 'circle':
          value = parseInt(value) || maxShapeSize;
          value = Math.min(value, maxShapeSize);
          S.Shape.switchShape(S.ShapeBuilder.circle(value));
          break;

        case 'kneel':
        case 'kneeling':
        case 'stickman':
          S.Shape.switchShape(S.ShapeBuilder.kneelingStickman());
          break;

        case 'heart':
        case 'love':
          S.Shape.switchShape(S.ShapeBuilder.heart());
          break;

        case 'time':
          var t = formatTime(new Date());

          if (sequence.length > 0) {
            S.Shape.switchShape(S.ShapeBuilder.letter(t));
          } else {
            timedAction(function () {
              t = formatTime(new Date());
              if (t !== time) {
                time = t;
                S.Shape.switchShape(S.ShapeBuilder.letter(time));
              }
            }, 1000);
          }
          break;

        default:
          S.Shape.switchShape(S.ShapeBuilder.letter(current[0] === cmd ? 'What?' : current));
      }
    }, window.innerWidth < 768 ? 1800 : 2000, sequence.length);
  }

  function checkInputWidth(e) {
    if (input.value.length > 18) {
      ui.classList.add('ui--wide');
    } else {
      ui.classList.remove('ui--wide');
    }

    if (firstAction && input.value.length > 0) {
      ui.classList.add('ui--enter');
    } else {
      ui.classList.remove('ui--enter');
    }
  }

  function bindEvents() {
    document.body.addEventListener('keydown', function (e) {
      input.focus();

      if (e.keyCode === 13) {
        firstAction = false;
        reset();
        performAction(input.value);
      }
    });

    // input.addEventListener('input', checkInputWidth);
    // input.addEventListener('change', checkInputWidth);
    // input.addEventListener('focus', checkInputWidth);

    // help.addEventListener('click', function (e) {
    //   overlay.classList.toggle('overlay--visible');
    //   overlay.classList.contains('overlay--visible') && reset(true);
    // });

    // commands.addEventListener('click', function (e) {
    //   var el,
    //       info,
    //       demo,
    //       tab,
    //       active,
    //       url;
    //
    //   if (e.target.classList.contains('commands-item')) {
    //     el = e.target;
    //   } else {
    //     el = e.target.parentNode.classList.contains('commands-item') ? e.target.parentNode : e.target.parentNode.parentNode;
    //   }
    //
    //   info = el && el.querySelector('.commands-item-info');
    //   demo = el && info.getAttribute('data-demo');
    //   url = el && info.getAttribute('data-url');
    //
    //   if (info) {
    //     overlay.classList.remove('overlay--visible');
    //
    //     if (demo) {
    //       input.value = demo;
    //
    //       if (isTouch) {
    //         reset();
    //         performAction(input.value);
    //       } else {
    //         input.focus();
    //       }
    //     } else if (url) {
    //       //window.location = url;
    //     }
    //   }
    // });

    canvas.addEventListener('click', function (e) {
      overlay.classList.remove('overlay--visible');
    });
  }

  function init() {
    bindEvents();
    // input.focus();
    isTouch && document.body.classList.add('touch');
  }

  // Init
  init();

  return {
    simulate: function (action) {
      performAction(action);
    }
  }
}());


S.UI.Tabs = (function () {
  var tabs = document.querySelector('.tabs'),
      labels = document.querySelector('.tabs-labels'),
      triggers = document.querySelectorAll('.tabs-label'),
      panels = document.querySelectorAll('.tabs-panel');

  function activate(i) {
    triggers[i].classList.add('tabs-label--active');
    panels[i].classList.add('tabs-panel--active');
  }

  function bindEvents() {
    labels.addEventListener('click', function (e) {
      var el = e.target,
          index;

      if (el.classList.contains('tabs-label')) {
        for (var t = 0; t < triggers.length; t++) {
          triggers[t].classList.remove('tabs-label--active');
          panels[t].classList.remove('tabs-panel--active');

          if (el === triggers[t]) {
            index = t;
          }
        }

        activate(index);
      }
    });
  }

  function init() {
    activate(0);
    bindEvents();
  }

  // Init
  init();
}());


S.Point = function (args) {
  this.x = args.x;
  this.y = args.y;
  this.z = args.z;
  this.a = args.a;
  this.h = args.h;
};


S.Color = function (r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
};

S.Color.prototype = {
  render: function () {
    return 'rgba(' + this.r + ',' +  + this.g + ',' + this.b + ',' + this.a + ')';
  }
};


S.Dot = function (x, y) {
  this.p = new S.Point({
    x: x,
    y: y,
    z: 3.2 + Math.random() * 1.2,
    a: 1,
    h: 0
  });

  this.e = 0.08;
  this.s = true;

  // 统一清新绿色系 - 柔和渐变，不晃眼
  // 主色调：从薄荷绿到青绿的柔和过渡
  var hueBase = 140 + Math.random() * 40; // 140-180 薄荷绿到青绿
  this.hue = hueBase % 360;
  this.hueSpeed = 0.08 + Math.random() * 0.06; // 极缓慢变化
  this.hueDir = Math.random() > 0.5 ? 1 : -1;
  this.saturation = 65 + Math.random() * 15;
  this.lightness = 58 + Math.random() * 12;

  // 呼吸效果 - 整体统一节奏，不杂乱
  this.breathPhase = Math.random() * Math.PI * 2;
  this.breathSpeed = 0.015 + Math.random() * 0.01;
  this.baseGlow = 4 + Math.random() * 3;

  this.c = new S.Color(120, 220, 160, this.p.a);
  this._updateColor();

  this.t = this.clone();
  this.q = [];
};

S.Dot.prototype = {
  _updateColor: function () {
    var h = this.hue % 360;
    if (h < 0) h += 360;
    var s = this.saturation;
    var l = this.lightness + Math.sin(this.breathPhase) * 5;
    var c = this._hslToRgb(h / 360, s / 100, l / 100);
    this.c.r = c[0];
    this.c.g = c[1];
    this.c.b = c[2];
  },

  _hslToRgb: function (h, s, l) {
    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  },

  clone: function () {
    return new S.Point({
      x: this.x,
      y: this.y,
      z: this.z,
      a: this.a,
      h: this.h
    });
  },

  _draw: function () {
    this.c.a = this.p.a;
    // 极缓慢的色相变化，整体色调统一
    this.hue += this.hueSpeed * this.hueDir;
    if (this.hue > 180 || this.hue < 130) this.hueDir *= -1;
    // 呼吸效果
    this.breathPhase += this.breathSpeed;
    this._updateColor();
    var glow = this.baseGlow + Math.sin(this.breathPhase) * 1.5;
    S.Drawing.drawCircle(this.p, this.c, glow);
  },

  _moveTowards: function (n) {
    var details = this.distanceTo(n, true),
        dx = details[0],
        dy = details[1],
        d = details[2],
        e = this.e * d;

    if (this.p.h === -1) {
      this.p.x = n.x;
      this.p.y = n.y;
      return true;
    }

    if (d > 1) {
      this.p.x -= ((dx / d) * e);
      this.p.y -= ((dy / d) * e);
    } else {
      if (this.p.h > 0) {
        this.p.h--;
      } else {
        return true;
      }
    }

    return false;
  },

  _update: function () {
    if (this._moveTowards(this.t)) {
      var p = this.q.shift();

      if (p) {
        this.t.x = p.x || this.p.x;
        this.t.y = p.y || this.p.y;
        this.t.z = p.z || this.p.z;
        this.t.a = p.a || this.p.a;
        this.p.h = p.h || 0;
      } else {
        if (this.s) {
          this.p.x -= Math.sin(Math.random() * 3.142);
          this.p.y -= Math.sin(Math.random() * 3.142);
        } else {
          this.move(new S.Point({
            x: this.p.x + (Math.random() * 50) - 25,
            y: this.p.y + (Math.random() * 50) - 25,
          }));
        }
      }
    }

    d = this.p.a - this.t.a;
    this.p.a = Math.max(0.1, this.p.a - (d * 0.05));
    d = this.p.z - this.t.z;
    this.p.z = Math.max(1, this.p.z - (d * 0.05));
  },

  distanceTo: function (n, details) {
    var dx = this.p.x - n.x,
        dy = this.p.y - n.y,
        d = Math.sqrt(dx * dx + dy * dy);

    return details ? [dx, dy, d] : d;
  },

  move: function (p, avoidStatic) {
    if (!avoidStatic || (avoidStatic && this.distanceTo(p) > 1)) {
      this.q.push(p);
    }
  },

  render: function () {
    this._update();
    this._draw();
  }
}


S.ShapeBuilder = (function () {
  var gap = 8,
      shapeCanvas = document.createElement('canvas'),
      shapeContext = shapeCanvas.getContext('2d'),
      fontSize = 500,
      fontFamily = 'Avenir, "Helvetica Neue", Helvetica, Arial, "PingFang SC", "Microsoft YaHei", sans-serif';

  function fit() {
    var isMobile = window.innerWidth < 768;
    gap = isMobile ? 7 : 8;
    shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;
    shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;
    shapeContext.fillStyle = 'red';
    shapeContext.textBaseline = 'middle';
    shapeContext.textAlign = 'center';
  }

  function processCanvas() {
    var pixels = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data;
        dots = [],
        pixels,
        x = 0,
        y = 0,
        fx = shapeCanvas.width,
        fy = shapeCanvas.height,
        w = 0,
        h = 0;

    for (var p = 0; p < pixels.length; p += (4 * gap)) {
      if (pixels[p + 3] > 0) {
        dots.push(new S.Point({
          x: x,
          y: y
        }));

        w = x > w ? x : w;
        h = y > h ? y : h;
        fx = x < fx ? x : fx;
        fy = y < fy ? y : fy;
      }

      x += gap;

      if (x >= shapeCanvas.width) {
        x = 0;
        y += gap;
        p += gap * 4 * shapeCanvas.width;
      }
    }

    return { dots: dots, w: w + fx, h: h + fy };
  }

  function setFontSize(s) {
    shapeContext.font = 'bold ' + s + 'px ' + fontFamily;
  }

  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function init() {
    fit();
    window.addEventListener('resize', fit);
  }

  // Init
  init();

  return {
    imageFile: function (url, callback) {
      var image = new Image(),
          a = S.Drawing.getArea();

      image.onload = function () {
        shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
        shapeContext.drawImage(this, 0, 0, a.h * 0.6, a.h * 0.6);
        callback(processCanvas());
      };

      image.onerror = function () {
        callback(S.ShapeBuilder.letter('What?'));
      }

      image.src = url;
    },

    circle: function (d) {
      var r = Math.max(0, d) / 2;
      shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
      shapeContext.beginPath();
      shapeContext.arc(r * gap, r * gap, r * gap, 0, 2 * Math.PI, false);
      shapeContext.fill();
      shapeContext.closePath();

      return processCanvas();
    },

    letter: function (l) {
      var s = 0;
      var isMobile = window.innerWidth < 768;

      setFontSize(fontSize);
      var widthRatio = isMobile ? 0.9 : 0.85;
      var heightRatio = isNumber(l) ? 1 : (isMobile ? 0.6 : 0.5);
      s = Math.min(fontSize,
                  (shapeCanvas.width / shapeContext.measureText(l).width) * widthRatio * fontSize,
                  (shapeCanvas.height / fontSize) * heightRatio * fontSize);
      setFontSize(s);

      shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
      shapeContext.fillText(l, shapeCanvas.width / 2, shapeCanvas.height / 2);

      return processCanvas();
    },

    rectangle: function (w, h) {
      var dots = [],
          width = gap * w,
          height = gap * h;

      for (var y = 0; y < height; y += gap) {
        for (var x = 0; x < width; x += gap) {
          dots.push(new S.Point({
            x: x,
            y: y,
          }));
        }
      }

      return { dots: dots, w: width, h: height };
    },

    kneelingStickman: function () {
      var a = S.Drawing.getArea();
      var isMobile = window.innerWidth < 768;
      var scale = isMobile ? 0.7 : 1;
      var w = 180 * scale;
      var h = 220 * scale;

      shapeCanvas.width = Math.ceil(w / gap) * gap;
      shapeCanvas.height = Math.ceil(h / gap) * gap;
      shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
      shapeContext.fillStyle = 'red';
      shapeContext.strokeStyle = 'red';
      shapeContext.lineWidth = gap * 1.8;
      shapeContext.lineCap = 'round';
      shapeContext.lineJoin = 'round';

      var cx = shapeCanvas.width / 2;
      var headR = 18 * scale;
      var headY = 28 * scale;

      // 头部
      shapeContext.beginPath();
      shapeContext.arc(cx, headY, headR, 0, Math.PI * 2);
      shapeContext.fill();

      var neckY = headY + headR;
      var bodyTop = neckY + 8 * scale;

      // 身体 - 略微前倾
      var bodyBottomX = cx - 15 * scale;
      var bodyBottomY = bodyTop + 55 * scale;
      shapeContext.beginPath();
      shapeContext.moveTo(cx - 3 * scale, bodyTop);
      shapeContext.lineTo(bodyBottomX, bodyBottomY);
      shapeContext.stroke();

      // 大腿 - 下跪姿势
      var kneeX = bodyBottomX + 35 * scale;
      var kneeY = bodyBottomY + 10 * scale;
      shapeContext.beginPath();
      shapeContext.moveTo(bodyBottomX, bodyBottomY);
      shapeContext.lineTo(kneeX, kneeY);
      shapeContext.stroke();

      // 小腿 - 向后跪
      var footX = kneeX - 20 * scale;
      var footY = kneeY + 30 * scale;
      shapeContext.beginPath();
      shapeContext.moveTo(kneeX, kneeY);
      shapeContext.lineTo(footX, footY);
      shapeContext.stroke();

      // 另一条腿（后面的，稍微短一点）
      var knee2X = bodyBottomX + 25 * scale;
      var knee2Y = bodyBottomY + 5 * scale;
      shapeContext.beginPath();
      shapeContext.moveTo(bodyBottomX - 2 * scale, bodyBottomY + 2 * scale);
      shapeContext.lineTo(knee2X, knee2Y);
      shapeContext.stroke();

      var foot2X = knee2X - 15 * scale;
      var foot2Y = knee2Y + 25 * scale;
      shapeContext.beginPath();
      shapeContext.moveTo(knee2X, knee2Y);
      shapeContext.lineTo(foot2X, foot2Y);
      shapeContext.stroke();

      // 手臂 - 合十/举起道歉姿势
      var armShoulderX = cx - 8 * scale;
      var armShoulderY = bodyTop + 15 * scale;
      // 左臂向上
      var handX = cx + 5 * scale;
      var handY = bodyTop - 15 * scale;
      shapeContext.beginPath();
      shapeContext.moveTo(armShoulderX, armShoulderY);
      shapeContext.lineTo(handX, handY);
      shapeContext.stroke();

      // 右臂向上（合十）
      var armShoulder2X = cx + 2 * scale;
      var armShoulder2Y = bodyTop + 18 * scale;
      shapeContext.beginPath();
      shapeContext.moveTo(armShoulder2X, armShoulder2Y);
      shapeContext.lineTo(handX + 3 * scale, handY + 2 * scale);
      shapeContext.stroke();

      return processCanvas();
    },

    heart: function () {
      var isMobile = window.innerWidth < 768;
      var scale = isMobile ? 0.6 : 0.8;
      var w = 200 * scale;
      var h = 180 * scale;

      shapeCanvas.width = Math.ceil(w / gap) * gap;
      shapeCanvas.height = Math.ceil(h / gap) * gap;
      shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
      shapeContext.fillStyle = 'red';

      var cx = shapeCanvas.width / 2;
      var cy = shapeCanvas.height / 2 + 10 * scale;
      var size = 60 * scale;

      // 绘制心形路径
      shapeContext.beginPath();
      var topCurveHeight = size * 0.3;
      shapeContext.moveTo(cx, cy + topCurveHeight);

      // 左边曲线
      shapeContext.bezierCurveTo(
        cx, cy,
        cx - size / 2, cy,
        cx - size / 2, cy + topCurveHeight
      );
      shapeContext.bezierCurveTo(
        cx - size / 2, cy + (size + topCurveHeight) / 2,
        cx, cy + (size + topCurveHeight) / 2 + size * 0.2,
        cx, cy + size
      );

      // 右边曲线
      shapeContext.bezierCurveTo(
        cx, cy + (size + topCurveHeight) / 2 + size * 0.2,
        cx + size / 2, cy + (size + topCurveHeight) / 2,
        cx + size / 2, cy + topCurveHeight
      );
      shapeContext.bezierCurveTo(
        cx + size / 2, cy,
        cx, cy,
        cx, cy + topCurveHeight
      );

      shapeContext.closePath();
      shapeContext.fill();

      return processCanvas();
    }
  };
}());


S.Shape = (function () {
  var dots = [],
      width = 0,
      height = 0,
      cx = 0,
      cy = 0;

  function compensate() {
    var a = S.Drawing.getArea();

    cx = a.w / 2 - width / 2;
    cy = a.h / 2 - height / 2;
  }

  return {
    shuffleIdle: function () {
      var a = S.Drawing.getArea();

      for (var d = 0; d < dots.length; d++) {
        if (!dots[d].s) {
          dots[d].move({
            x: Math.random() * a.w,
            y: Math.random() * a.h
          });
        }
      }
    },

    switchShape: function (n, fast) {
      var size,
          a = S.Drawing.getArea();

      width = n.w;
      height = n.h;

      compensate();

      if (n.dots.length > dots.length) {
        size = n.dots.length - dots.length;
        for (var d = 1; d <= size; d++) {
          dots.push(new S.Dot(a.w / 2, a.h / 2));
        }
      }

      var d = 0,
          i = 0;

      while (n.dots.length > 0) {
        i = Math.floor(Math.random() * n.dots.length);
        dots[d].e = fast ? 0.25 : (dots[d].s ? 0.14 : 0.11);

        if (dots[d].s) {
          dots[d].move(new S.Point({
            z: Math.random() * 20 + 10,
            a: Math.random(),
            h: 18
          }));
        } else {
          dots[d].move(new S.Point({
            z: Math.random() * 5 + 5,
            h: fast ? 18 : 30
          }));
        }

        dots[d].s = true;
        dots[d].move(new S.Point({
          x: n.dots[i].x + cx,
          y: n.dots[i].y + cy,
          a: 1,
          z: 5,
          h: 0
        }));

        n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1));
        d++;
      }

      for (var i = d; i < dots.length; i++) {
        if (dots[i].s) {
          dots[i].move(new S.Point({
            z: Math.random() * 20 + 10,
            a: Math.random(),
            h: 20
          }));

          dots[i].s = false;
          dots[i].e = 0.04;
          dots[i].move(new S.Point({
            x: Math.random() * a.w,
            y: Math.random() * a.h,
            a: 0.3, //.4
            z: Math.random() * 4,
            h: 0
          }));
        }
      }
    },

    render: function () {
      for (var d = 0; d < dots.length; d++) {
        dots[d].render();
      }
    }
  }
}());


S.init();
