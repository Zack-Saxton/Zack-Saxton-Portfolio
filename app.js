// const myvid = document.getElementById('myvideo')
// const playbutton = document.getElementById ('playme')
// const jumplink = document.getElementById ('jump')



var events = new Events();
events.add = function (obj) {
  obj.events = {};
};
events.implement = function (fn) {
  fn.prototype = Object.create(Events.prototype);
};

function Events() {
  this.events = {};
}
Events.prototype.on = function (name, fn) {
  var events = this.events[name];
  if (events == undefined) {
    this.events[name] = [fn];
    this.emit("event:on", fn);
  } else {
    if (events.indexOf(fn) == -1) {
      events.push(fn);
      this.emit("event:on", fn);
    }
  }
  return this;
};
Events.prototype.once = function (name, fn) {
  var events = this.events[name];
  fn.once = true;
  if (!events) {
    this.events[name] = [fn];
    this.emit("event:once", fn);
  } else {
    if (events.indexOf(fn) == -1) {
      events.push(fn);
      this.emit("event:once", fn);
    }
  }
  return this;
};
Events.prototype.emit = function (name, args) {
  var events = this.events[name];
  if (events) {
    var i = events.length;
    while (i--) {
      if (events[i]) {
        events[i].call(this, args);
        if (events[i].once) {
          delete events[i];
        }
      }
    }
  }
  return this;
};
Events.prototype.unbind = function (name, fn) {
  if (name) {
    var events = this.events[name];
    if (events) {
      if (fn) {
        var i = events.indexOf(fn);
        if (i != -1) {
          delete events[i];
        }
      } else {
        delete this.events[name];
      }
    }
  } else {
    delete this.events;
    this.events = {};
  }
  return this;
};

var userPrefix;

var prefix = (function () {
  var styles = window.getComputedStyle(document.documentElement, ""),
    pre = (Array.prototype.slice
      .call(styles)
      .join("")
      .match(/-(moz|webkit|ms)-/) ||
      (styles.OLink === "" && ["", "o"]))[1],
    dom = "WebKit|Moz|MS|O".match(new RegExp("(" + pre + ")", "i"))[1];
  userPrefix = {
    dom: dom,
    lowercase: pre,
    css: "-" + pre + "-",
    js: pre[0].toUpperCase() + pre.substr(1),
  };
})();

function bindEvent(element, type, handler) {
  if (element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else {
    element.attachEvent("on" + type, handler);
  }
}

function Viewport(data) {
  events.add(this);

  var self = this;

  this.element = data.element;
  this.fps = data.fps;
  this.sensivity = data.sensivity;
  this.sensivityFade = data.sensivityFade;
  this.touchSensivity = data.touchSensivity;
  this.speed = data.speed;

  this.lastX = 0;
  this.lastY = 0;
  this.mouseX = 0;
  this.mouseY = 0;
  this.distanceX = 0;
  this.distanceY = 0;
  this.positionX = 1122;
  this.positionY = 136;
  this.torqueX = 0;
  this.torqueY = 0;

  this.down = false;
  this.upsideDown = false;

  this.previousPositionX = 0;
  this.previousPositionY = 0;

  this.currentSide = 0;
  this.calculatedSide = 0;

  bindEvent(document, "mousedown", function () {
    self.down = true;
  });

  bindEvent(document, "mouseup", function () {
    self.down = false;
  });

  bindEvent(document, "keyup", function () {
    self.down = false;
  });

  bindEvent(document, "mousemove", function (e) {
    self.mouseX = e.pageX;
    self.mouseY = e.pageY;
  });

  bindEvent(document, "touchstart", function (e) {
    self.down = true;
    e.touches ? (e = e.touches[0]) : null;
    self.mouseX = e.pageX / self.touchSensivity;
    self.mouseY = e.pageY / self.touchSensivity;
    self.lastX = self.mouseX;
    self.lastY = self.mouseY;
  });

  bindEvent(document, "touchmove", function (e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    if (e.touches.length == 1) {
      e.touches ? (e = e.touches[0]) : null;

      self.mouseX = e.pageX / self.touchSensivity;
      self.mouseY = e.pageY / self.touchSensivity;
    }
  });

  bindEvent(document, "touchend", function (e) {
    self.down = false;
  });

  setInterval(this.animate.bind(this), this.fps);
}
events.implement(Viewport);
Viewport.prototype.animate = function () {
  this.distanceX = this.mouseX - this.lastX;
  this.distanceY = this.mouseY - this.lastY;

  this.lastX = this.mouseX;
  this.lastY = this.mouseY;

  if (this.down) {
    this.torqueX =
      this.torqueX * this.sensivityFade +
      (this.distanceX * this.speed - this.torqueX) * this.sensivity;
    this.torqueY =
      this.torqueY * this.sensivityFade +
      (this.distanceY * this.speed - this.torqueY) * this.sensivity;
  }

  if (Math.abs(this.torqueX) > 1.0 || Math.abs(this.torqueY) > 1.0) {
    if (!this.down) {
      this.torqueX *= this.sensivityFade;
      this.torqueY *= this.sensivityFade;
    }

    this.positionY -= this.torqueY;

    if (this.positionY > 360) {
      this.positionY -= 360;
    } else if (this.positionY < 0) {
      this.positionY += 360;
    }

    if (this.positionY > 90 && this.positionY < 270) {
      this.positionX -= this.torqueX;

      if (!this.upsideDown) {
        this.upsideDown = true;
        this.emit("upsideDown", { upsideDown: this.upsideDown });
      }
    } else {
      this.positionX += this.torqueX;

      if (this.upsideDown) {
        this.upsideDown = false;
        this.emit("upsideDown", { upsideDown: this.upsideDown });
      }
    }

    if (this.positionX > 360) {
      this.positionX -= 360;
    } else if (this.positionX < 0) {
      this.positionX += 360;
    }

    if (
      !(this.positionY >= 46 && this.positionY <= 130) &&
      !(this.positionY >= 220 && this.positionY <= 308)
    ) {
      if (this.upsideDown) {
        if (this.positionX >= 42 && this.positionX <= 130) {
          this.calculatedSide = 3;
        } else if (this.positionX >= 131 && this.positionX <= 223) {
          this.calculatedSide = 2;
        } else if (this.positionX >= 224 && this.positionX <= 314) {
          this.calculatedSide = 5;
        } else {
          this.calculatedSide = 4;
        }
      } else {
        if (this.positionX >= 42 && this.positionX <= 130) {
          this.calculatedSide = 5;
        } else if (this.positionX >= 131 && this.positionX <= 223) {
          this.calculatedSide = 4;
        } else if (this.positionX >= 224 && this.positionX <= 314) {
          this.calculatedSide = 3;
        } else {
          this.calculatedSide = 2;
        }
      }
    } else {
      if (this.positionY >= 46 && this.positionY <= 130) {
        this.calculatedSide = 6;
      }

      if (this.positionY >= 220 && this.positionY <= 308) {
        this.calculatedSide = 1;
      }
    }

    if (this.calculatedSide !== this.currentSide) {
      this.currentSide = this.calculatedSide;
      this.emit("sideChange");
    }
  }

  this.element.style[userPrefix.js + "Transform"] =
    "rotateX(" + this.positionY + "deg) rotateY(" + this.positionX + "deg)";

  if (
    this.positionY != this.previousPositionY ||
    this.positionX != this.previousPositionX
  ) {
    this.previousPositionY = this.positionY;
    this.previousPositionX = this.positionX;

    this.emit("rotate");
  }
};
var viewport = new Viewport({
  element: document.getElementsByClassName("cube")[0],
  fps: 20,
  sensivity: 0.1,
  sensivityFade: 0.93,
  speed: 2,
  touchSensivity: 1.5,
});

function Cube(data) {
  var self = this;

  this.element = data.element;
  this.sides = this.element.getElementsByClassName("side");

  this.viewport = data.viewport;
  this.viewport.on("rotate", function () {
    self.rotateSides();
  });
  this.viewport.on("upsideDown", function (obj) {
    self.upsideDown(obj);
  });
  this.viewport.on("sideChange", function () {
    self.sideChange();
  });
}
Cube.prototype.rotateSides = function () {
  var viewport = this.viewport;
  if (viewport.positionY > 90 && viewport.positionY < 270) {
    this.sides[0].getElementsByClassName("cube-image")[0].style[
      userPrefix.js + "Transform"
    ] = "rotate(" + (viewport.positionX + viewport.torqueX) + "deg)";
    this.sides[5].getElementsByClassName("cube-image")[0].style[
      userPrefix.js + "Transform"
    ] = "rotate(" + -(viewport.positionX + 180 + viewport.torqueX) + "deg)";
  } else {
    this.sides[0].getElementsByClassName("cube-image")[0].style[
      userPrefix.js + "Transform"
    ] = "rotate(" + (viewport.positionX - viewport.torqueX) + "deg)";
    this.sides[5].getElementsByClassName("cube-image")[0].style[
      userPrefix.js + "Transform"
    ] = "rotate(" + -(viewport.positionX + 180 - viewport.torqueX) + "deg)";
  }
};
Cube.prototype.upsideDown = function (obj) {
  var deg = obj.upsideDown == true ? "180deg" : "0deg";
  var i = 5;

  while (i > 0 && --i) {
    this.sides[i].getElementsByClassName("cube-image")[0].style[
      userPrefix.js + "Transform"
    ] = "rotate(" + deg + ")";
  }
};
Cube.prototype.sideChange = function () {
  for (var i = 0; i < this.sides.length; ++i) {
    this.sides[i].getElementsByClassName("cube-image")[0].className =
      "cube-image";
  }

  this.sides[this.viewport.currentSide - 1].getElementsByClassName(
    "cube-image"
  )[0].className = "cube-image active";
};

new Cube({
  viewport: viewport,
  element: document.getElementsByClassName("cube")[0],
});



// Play Pause function



var ppbutton = document.getElementById("about");
ppbutton.addEventListener("dblclick", playPause);
myVideo = document.getElementById("myvid");

var ppbutton = document.getElementById("contact");
ppbutton.addEventListener("dblclick", playPause);
myVideo = document.getElementById("myvid");

var ppbutton = document.getElementById("projects");
ppbutton.addEventListener("dblclick", playPause);
myVideo = document.getElementById("myvid");

var ppbutton = document.getElementById("resume");
ppbutton.addEventListener("dblclick", playPause);
myVideo = document.getElementById("myvid");

var ppbutton = document.getElementById("home");
ppbutton.addEventListener("dblclick", playPause);
myVideo = document.getElementById("myvid");

var ppbutton = document.getElementById("other");
ppbutton.addEventListener("dblclick", playPause);
myVideo = document.getElementById("myvid");

function playPause() {
  if (myVideo.paused) {
    myVideo.play();
    // ppbutton.innerHTML = "On My Way";
    //   } else {
    //     myVideo.pause();
    // ppbutton.innerHTML = "About";  
  }

 

  //   Speed Function
  var vid = document.getElementById("myvid");
  vid.playbackRate = 8.0;

  // Stop interval function

  var $video = $(myvid);
  var video = $video.get(0);

  video.addEventListener("timeupdate", function () {
    var lastCheckedAt = $video.data("lastcheck") || 0;
    $video.data("lastcheck", this.currentTime);

    if (this.currentTime >= 4 && lastCheckedAt < 4) {
      console.log("4 seconds");
      this.pause();
      $("button").show();

    } else if (this.currentTime >= 9 && lastCheckedAt < 9) {
      console.log("9 seconds");
      this.pause();

      $("button").text("about").show();
    } else if (this.currentTime >= 14 && lastCheckedAt < 14) {
      console.log("14 seconds");
      this.pause();

      // $("about").text("about").show();
    } else if (this.currentTime >= 18) {
      console.log("18 seconds");
      this.pause();

      // $("button").text("Part 5").show();
    }
  });

  $("button").click(function () {
    video.play();
    $("button").hide();
  });
}


// var play = document.getElementById("about");
// play.addEventListener("click", playPause);
// myvideo = document.getElementById ("myvideo");



//   .onclick = function ffTo6 ( )



//   var vid = document.getElementById('myvideo')
//       addEventListener // number of milliseconds between frames in fast-forward/rewind
//       endtime = 6.0; // time to fast-forward/remind to (in seconds)
//   // fast-forward/rewind video to end time 
//   var tdelta = (endtime - vid.currentTime)/ticks; 
//   var startTime = vid.currentTime;
//   for ( var i = 0; i < ticks; ++i )
//   {
//      (function(j){
//          setTimeout(function() {
//                vid.currentTime = startTime+tdelta * j;
//          }, j * frms);
//      })(i);
//   }
// } 






// const play = document.getElementById ("contact")

// video.addEventListener("timeupdate", function(){
//   if(this.currentTime >= 60 / 10) {
//       this.pause();
//   }
// });

// var myvideo = document.getElementById('myvideo'),
//     playbutton = document.getElementById('about'),
//     jumplink = document.getElementById('contact');

// contact.addEventListener("click", function (event) {
//     event.preventDefault();
//     myvideo.play();
//     myvideo.setTimeout(pauseVid, 3000);
//     myvideo.currentTime ();
//     myvideo.play();
// }, false);

// // only in to demonstrate video
// playbutton.addEventListener("click", function () {
//     if (myvideo.paused) {
//         myvideo.play();
//     } else {
//         myvideo.pause();
//     }
// }, false);