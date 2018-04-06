

    var socket = io();

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating
    // shim layer with setTimeout fallback
    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    // namespace our game
    var POP = {

        // set up some inital values
        WIDTH: 320,
        HEIGHT: 480,
        scale: 1,
        // the position of the canvas
        // in relation to the screen
        offset: {
            top: 0,
            left: 0
        },
        // store all bubble, touches, particles etc
        entities: [],
        banner: {},
        // the amount of game ticks until
        // we spawn a bubble
        nextBubble: 100,
        // for tracking player's progress
        score: {
            taps: 0,
            hit: 0,
            escaped: 0,
            accuracy: 0
        },
        // we'll set the rest of these
        // in the init function
        RATIO: null,
        currentWidth: null,
        currentHeight: null,
        canvas: null,
        ctx: null,
        ua: null,
        android: null,
        ios: null,

        init: function() {

            // the proportion of width to height
            POP.RATIO = POP.WIDTH / POP.HEIGHT;
            // these will change when the screen is resize
            POP.currentWidth = POP.WIDTH;
            POP.currentHeight = POP.HEIGHT;
            // this is our canvas element
            POP.canvas = document.getElementsByTagName('canvas')[0];

            POP.banner = new POP.Banner();
            // it's important to set this
            // otherwise the browser will
            // default to 320x200
            POP.canvas.width = POP.WIDTH;
            POP.canvas.height = POP.HEIGHT;
            // the canvas context allows us to
            // interact with the canvas api
            POP.ctx = POP.canvas.getContext('2d');
            // we need to sniff out android & ios
            // so we can hide the address bar in
            // our resize function
            POP.ua = navigator.userAgent.toLowerCase();
            POP.android = POP.ua.indexOf('android') > -1 ? true : false;
            POP.ios = (POP.ua.indexOf('iphone') > -1 || POP.ua.indexOf('ipad') > -1) ? true : false;

            // set up our wave effect
            // basically, a series of overlapping circles
            // across the top of screen
            POP.wave = {
                x: -25, // x coord of first circle
                y: -40, // y coord of first circle
                r: 50, // circle radius
                time: 0, // we'll use this in calculating the sine wave
                offset: 0 // this will be the sine wave offset
            };
            // calculate how many circles we need to
            // cover the screen width
            POP.wave.total = Math.ceil(POP.WIDTH / POP.wave.r) + 1;

            // listen for clicks
            window.addEventListener('click', function(e) {
                e.preventDefault();
                POP.Input.set(e);
            }, false);

            // listen for touches
            window.addEventListener('touchstart', function(e) {
                e.preventDefault();
                // the event object has an array
                // called touches, we just want
                // the first touch
                POP.Input.set(e.touches[0]);
            }, false);
            window.addEventListener('touchmove', function(e) {
                // we're not interested in this
                // but prevent default behaviour
                // so the screen doesn't scroll
                // or zoom
                e.preventDefault();
            }, false);
            window.addEventListener('touchend', function(e) {
                // as above
                e.preventDefault();
            }, false);

            // we're ready to resize
            POP.resize();

            POP.loop();

        },


        resize: function() {
          console.log("resize");

            POP.currentHeight = window.innerHeight;
            // resize the width in proportion
            // to the new height
            POP.currentWidth = POP.currentHeight * POP.RATIO;

            // this will create some extra space on the
            // page, allowing us to scroll pass
            // the address bar, and thus hide it.
            if (POP.android || POP.ios) {
                document.body.style.height = (window.innerHeight + 50) + 'px';
            }

            // set the new canvas style width & height
            // note: our canvas is still 320x480 but
            // we're essentially scaling it with CSS
            POP.canvas.style.width = POP.currentWidth + 'px';
            POP.canvas.style.height = POP.currentHeight + 'px';

            // the amount by which the css resized canvas
            // is different to the actual (480x320) size.
            POP.scale = POP.currentWidth / POP.WIDTH;
            // position of canvas in relation to
            // the screen
            POP.offset.top = POP.canvas.offsetTop;
            POP.offset.left = POP.canvas.offsetLeft;

            // we use a timeout here as some mobile
            // browsers won't scroll if there is not
            // a small delay
            window.setTimeout(function() {
                window.scrollTo(0, 1);
            }, 1);
        },

        // this is where all entities will be moved
        // and checked for collisions etc
        update: function() {
            var i,
                checkCollision = false; // we only need to check for a collision
            // if the user tapped on this game tick


            // decrease our nextBubble counter


            // spawn a new instance of Touch
            // if the user has tapped the screen

            // cycle through all entities and update as necessary
            for (i = 0; i < POP.entities.length; i += 1) {
                POP.entities[i].update();

                // if (POP.entities[i].type === 'bubble' && checkCollision) {
                //     hit = POP.collides(POP.entities[i],
                //                         {x: POP.Input.x, y: POP.Input.y, r: 7});
                //     if (hit) {
                //         // spawn an exposion
                //         for (var n = 0; n < 5; n +=1 ) {
                //             POP.entities.push(new POP.Particle(
                //                 POP.entities[i].x,
                //                 POP.entities[i].y,
                //                 2,
                //                 // random opacity to spice it up a bit
                //                 'rgba(255,255,255,'+Math.random()*1+')'
                //             ));
                //         }
                //         POP.score.hit += 1;
                //     }
                //
                //     POP.entities[i].remove = hit;
                // }
                //
                // // delete from array if remove property
                // // flag is set to true
                if (POP.entities[i].remove) {
                    POP.entities.splice(i, 1);
                }
            }

            POP.banner.update();


            // update wave offset
            // feel free to play with these values for
            // either slower or faster waves
            POP.wave.time = new Date().getTime() * 0.002;
            POP.wave.offset = Math.sin(POP.wave.time * 0.8) * 5;

            // calculate accuracy
            POP.score.accuracy = (POP.score.hit / POP.score.taps) * 100;
            POP.score.accuracy = isNaN(POP.score.accuracy) ?
                0 :
                ~~(POP.score.accuracy); // a handy way to round floats

        },


        // this is where we draw all the entities
        render: function() {

            var i;



            POP.Draw.rect(0, 0, POP.WIDTH, POP.HEIGHT, '#C8DFC4');
            POP.banner.render();
            for (i = 0; i < POP.entities.length; i += 1) {
                POP.entities[i].render();
            }


            // // display scores
            // POP.Draw.text('Hit: ' + POP.score.hit, 20, 30, 14, '#fff');
            // POP.Draw.text('Escaped: ' + POP.score.escaped, 20, 50, 14, '#fff');

            // POP.Draw.text('Accuracy: ' + POP.score.accuracy + '%', 20, 70, 14, '#fff');
            // console.log(POP.currentWidth)
            // console.log(POP.currentHeight)
            // POP.Draw.rect(0, 0, POP.WIDTH, POP.HEIGHT, '#fff');


        },


        // the actual loop
        // requests animation frame
        // then proceeds to update
        // and render
        loop: function() {

            requestAnimFrame(POP.loop);

            POP.update();
            POP.render();
        }


    };

    // checks if two entties are touching
    POP.collides = function(a, b) {

        var distance_squared = (((a.x - b.x) * (a.x - b.x)) +
            ((a.y - b.y) * (a.y - b.y)));

        var radii_squared = (a.r + b.r) * (a.r + b.r);

        if (distance_squared < radii_squared) {
            return true;
        } else {
            return false;
        }
    };


    // abstracts various canvas operations into
    // standalone functions
    POP.Draw = {

        clear: function() {
            POP.ctx.clearRect(0, 0, POP.WIDTH, POP.HEIGHT);
        },


        rect: function(x, y, w, h, col) {
            POP.ctx.fillStyle = col;
            POP.ctx.fillRect(x, y, w, h);
        },

        circle: function(x, y, r, col) {
            POP.ctx.fillStyle = col;
            POP.ctx.beginPath();
            POP.ctx.arc(x + 5, y + 5, r, 0, Math.PI * 2, true);
            POP.ctx.closePath();
            POP.ctx.fill();
        },


        text: function(string, x, y, size, col) {
            POP.ctx.font = 'bold ' + size + 'px Monospace';
            POP.ctx.fillStyle = col;
            POP.ctx.fillText(string, x, y);
        },

        image: function(id, dx, dy, dWidth, dHeight) {
            var image = document.getElementById(id);
            POP.ctx.drawImage(image, dx, dy, dWidth, dHeight);
        }

    };




    POP.Input = {

        x: 0,
        y: 0,
        tapped: false,

        set: function(data) {
            this.x = (data.pageX - POP.offset.left) / POP.scale;
            this.y = (data.pageY - POP.offset.top) / POP.scale;
            this.tapped = true;

        }

    };

    POP.Touch = function(x, y) {

        this.type = 'touch'; // we'll need this later
        this.x = x; // the x coordinate
        this.y = y; // the y coordinate
        this.r = 5; // the radius
        this.opacity = 1; // inital opacity. the dot will fade out
        this.fade = 0.05; // amount by which to fade on each game tick
        // this.remove = false;    // flag for removing this entity. POP.update
        // will take care of this

        this.update = function() {
            // reduct the opacity accordingly
            this.opacity -= this.fade;
            // if opacity if 0 or less, flag for removal
            this.remove = (this.opacity < 0) ? true : false;
        };

        this.render = function() {
            POP.Draw.circle(this.x, this.y, this.r, 'rgba(255,0,0,' + this.opacity + ')');
        };

    };

    POP.Bubble = function(data) {
        this.color = data.color;
        this.name = data.name;
        this.type = 'bubble';
        this.r = 20;
        this.speed = 2;


        this.x = data.x;
        this.y = data.y;

        // the amount by which the bubble
        // will move from side to side
        this.waveSize = 5 + this.r;
        // we need to remember the original
        // x position for our sine wave calculation
        this.xConstant = this.x;

        this.remove = false;

        this.sinoffset = Math.random() * 100;

        this.update = function() {

            // a sine wave is commonly a function of time
            var time = new Date().getTime() * 0.002 + this.sinoffset;

            this.y -= this.speed;
            // the x coord to follow a sine wave
            this.x = this.waveSize * Math.sin(time) + this.xConstant;

            // if offscreen flag for removal
            if (this.y < -10) {
                POP.score.escaped += 1; // update score
                this.remove = true;
            }

        };

        this.render = function() {

            POP.Draw.circle(this.x, this.y, this.r, this.color);
            POP.Draw.text(this.name, this.x, this.y, 14, '#000');
        };

    };

    POP.Banner = function() {
            this.update = function() {
                    //BANNER mechanics
                    if (POP.Input.tapped && POP.Input.y > POP.HEIGHT - POP.WIDTH / 3) {
                        for (var n = 0; n < 5; n += 1) {
                            POP.entities.push(new POP.Particle(
                                POP.Input.x,
                                POP.Input.y,
                                2,
                                // random opacity to spice it up a bit
                                'rgba(255,255,255,' + Math.random() * 1 + ')'
                            ));
                        }

                        bubbledata = {
                            x: POP.Input.x,
                            y: POP.Input.y,
                            name: myname
                        }

                        console.log(bubbledata)
                        if (POP.Input.x < POP.WIDTH / 3) {
                            // POP.entities.push(new POP.Bubble(POP.Input.x,POP.Input.y,"rgba(255,0,0,255)"));
                            bubbledata.color = "rgba(255,0,0,255)";
                        } else if (POP.Input.x < 2 * POP.WIDTH / 3) {
                            bubbledata.color = "rgba(255,255,0,255)";
                            // POP.entities.push(new POP.Bubble(POP.Input.x,POP.Input.y,"rgba(255,255,0,255)"));
                        } else {
                            bubbledata.color = "rgba(0,255,0,255)";
                            // POP.entities.push(new POP.Bubble(POP.Input.x,POP.Input.y,"rgba(0,255,0,255)"));
                        }
                        socket.emit("new bubble", bubbledata);
                        POP.entities.push(new POP.Bubble(bubbledata));
                        POP.Input.tapped = false;
                    }

                },

                this.render = function() {
                    POP.Draw.image("banner", 0, POP.HEIGHT - POP.WIDTH / 3, POP.WIDTH, POP.WIDTH / 3)

                }
        },

        POP.Particle = function(x, y, r, col) {

            this.x = x;
            this.y = y;
            this.r = r;
            this.col = col;

            // determines whether particle will
            // travel to the right of left
            // 50% chance of either happening
            this.dir = (Math.random() * 2 > 1) ? 1 : -1;

            // random values so particles do no
            // travel at the same speeds
            this.vx = ~~(Math.random() * 4) * this.dir;
            this.vy = ~~(Math.random() * 7);

            this.remove = false;


            this.update = function() {

                // update coordinates
                this.x += this.vx;
                this.y += this.vy;

                // increase velocity so particle
                // accelerates off screen
                this.vx *= 0.99;
                this.vy *= 0.99;

                // adding this negative amount to the
                // y velocity exerts an upward pull on
                // the particle, as if drawn to the
                // surface
                this.vy -= 0.25;

                // offscreen
                if (this.y < 0) {
                    this.remove = true;
                }

            };


            this.render = function() {
                POP.Draw.circle(this.x, this.y, this.r, this.col);
            };

        };


    socket.on('new bubble', function(data) {
        console.log('new bubble')
        POP.entities.push(new POP.Bubble(data));
    });

    window.addEventListener('load', POP.init, false);
    window.addEventListener('resize', POP.resize, false);






// $(function() {
//   var FADE_TIME = 150; // ms
//   var TYPING_TIMER_LENGTH = 400; // ms
//   var COLORS = [
//     '#e21400', '#91580f', '#f8a700', '#f78b00',
//     '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
//     '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
//   ];
//
//   // Initialize variables
//   var $window = $(window);
//   var $usernameInput = $('.usernameInput'); // Input for username
//   var $messages = $('.messages'); // Messages area
//   var $inputMessage = $('.inputMessage'); // Input message input box
//
//   var $loginPage = $('.login.page'); // The login page
//   var $chatPage = $('.chat.page'); // The chatroom page
//
//   // Prompt for setting a username
//   var username;
//   var connected = false;
//   var typing = false;
//   var lastTypingTime;
//   var $currentInput = $usernameInput.focus();
//
//   var socket = io();
//
//   function addParticipantsMessage (data) {
//     var message = '';
//     if (data.numUsers === 1) {
//       message += "there's 1 participant";
//     } else {
//       message += "there are " + data.numUsers + " participants";
//     }
//     log(message);
//   }
//
//   // Sets the client's username
//   function setUsername () {
//     username = cleanInput($usernameInput.val().trim());
//
//     // If the username is valid
//     if (username) {
//       $loginPage.fadeOut();
//       $chatPage.show();
//       $loginPage.off('click');
//       $currentInput = $inputMessage.focus();
//
//       // Tell the server your username
//       socket.emit('add user', username);
//     }
//   }
//
//   // Sends a chat message
//   function sendMessage () {
//     var message = $inputMessage.val();
//     // Prevent markup from being injected into the message
//     message = cleanInput(message);
//     // if there is a non-empty message and a socket connection
//     if (message && connected) {
//       $inputMessage.val('');
//       addChatMessage({
//         username: username,
//         message: message
//       });
//       // tell server to execute 'new message' and send along one parameter
//       socket.emit('new message', message);
//     }
//   }
//
//   // Log a message
//   function log (message, options) {
//     var $el = $('<li>').addClass('log').text(message);
//     addMessageElement($el, options);
//   }
//
//   // Adds the visual chat message to the message list
//   function addChatMessage (data, options) {
//     // Don't fade the message in if there is an 'X was typing'
//     var $typingMessages = getTypingMessages(data);
//     options = options || {};
//     if ($typingMessages.length !== 0) {
//       options.fade = false;
//       $typingMessages.remove();
//     }
//
//     var $usernameDiv = $('<span class="username"/>')
//       .text(data.username)
//       .css('color', getUsernameColor(data.username));
//     var $messageBodyDiv = $('<span class="messageBody">')
//       .text(data.message);
//
//     var typingClass = data.typing ? 'typing' : '';
//     var $messageDiv = $('<li class="message"/>')
//       .data('username', data.username)
//       .addClass(typingClass)
//       .append($usernameDiv, $messageBodyDiv);
//
//     addMessageElement($messageDiv, options);
//   }
//
//   // Adds the visual chat typing message
//   function addChatTyping (data) {
//     data.typing = true;
//     data.message = 'is typing';
//     addChatMessage(data);
//   }
//
//   // Removes the visual chat typing message
//   function removeChatTyping (data) {
//     getTypingMessages(data).fadeOut(function () {
//       $(this).remove();
//     });
//   }
//
//   // Adds a message element to the messages and scrolls to the bottom
//   // el - The element to add as a message
//   // options.fade - If the element should fade-in (default = true)
//   // options.prepend - If the element should prepend
//   //   all other messages (default = false)
//   function addMessageElement (el, options) {
//     var $el = $(el);
//
//     // Setup default options
//     if (!options) {
//       options = {};
//     }
//     if (typeof options.fade === 'undefined') {
//       options.fade = true;
//     }
//     if (typeof options.prepend === 'undefined') {
//       options.prepend = false;
//     }
//
//     // Apply options
//     if (options.fade) {
//       $el.hide().fadeIn(FADE_TIME);
//     }
//     if (options.prepend) {
//       $messages.prepend($el);
//     } else {
//       $messages.append($el);
//     }
//     $messages[0].scrollTop = $messages[0].scrollHeight;
//   }
//
//   // Prevents input from having injected markup
//   function cleanInput (input) {
//     return $('<div/>').text(input).html();
//   }
//
//   // Updates the typing event
//   function updateTyping () {
//     if (connected) {
//       if (!typing) {
//         typing = true;
//         socket.emit('typing');
//       }
//       lastTypingTime = (new Date()).getTime();
//
//       setTimeout(function () {
//         var typingTimer = (new Date()).getTime();
//         var timeDiff = typingTimer - lastTypingTime;
//         if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
//           socket.emit('stop typing');
//           typing = false;
//         }
//       }, TYPING_TIMER_LENGTH);
//     }
//   }
//
//   // Gets the 'X is typing' messages of a user
//   function getTypingMessages (data) {
//     return $('.typing.message').filter(function (i) {
//       return $(this).data('username') === data.username;
//     });
//   }
//
//   // Gets the color of a username through our hash function
//   function getUsernameColor (username) {
//     // Compute hash code
//     var hash = 7;
//     for (var i = 0; i < username.length; i++) {
//        hash = username.charCodeAt(i) + (hash << 5) - hash;
//     }
//     // Calculate color
//     var index = Math.abs(hash % COLORS.length);
//     return COLORS[index];
//   }
//
//   // Keyboard events
//
//   $window.keydown(function (event) {
//     // Auto-focus the current input when a key is typed
//     if (!(event.ctrlKey || event.metaKey || event.altKey)) {
//       $currentInput.focus();
//     }
//     // When the client hits ENTER on their keyboard
//     if (event.which === 13) {
//       if (username) {
//         sendMessage();
//         socket.emit('stop typing');
//         typing = false;
//       } else {
//         setUsername();
//       }
//     }
//   });
//
//   $inputMessage.on('input', function() {
//     updateTyping();
//   });
//
//   // Click events
//
//   // Focus input when clicking anywhere on login page
//   $loginPage.click(function () {
//     $currentInput.focus();
//   });
//
//   // Focus input when clicking on the message input's border
//   $inputMessage.click(function () {
//     $inputMessage.focus();
//   });
//
//   // Socket events
//
//   // Whenever the server emits 'login', log the login message
//   socket.on('login', function (data) {
//     connected = true;
//     // Display the welcome message
//     var message = "Welcome to Socket.IO Chat – ";
//     log(message, {
//       prepend: true
//     });
//     addParticipantsMessage(data);
//   });
//
//   // Whenever the server emits 'new message', update the chat body
//   socket.on('new message', function (data) {
//     addChatMessage(data);
//   });
//
//   // Whenever the server emits 'user joined', log it in the chat body
//   socket.on('user joined', function (data) {
//     log(data.username + ' joined');
//     addParticipantsMessage(data);
//   });
//
//   // Whenever the server emits 'user left', log it in the chat body
//   socket.on('user left', function (data) {
//     log(data.username + ' left');
//     addParticipantsMessage(data);
//     removeChatTyping(data);
//   });
//
//   // Whenever the server emits 'typing', show the typing message
//   socket.on('typing', function (data) {
//     addChatTyping(data);
//   });
//
//   // Whenever the server emits 'stop typing', kill the typing message
//   socket.on('stop typing', function (data) {
//     removeChatTyping(data);
//   });
//
//   socket.on('disconnect', function () {
//     log('you have been disconnected');
//   });
//
//   socket.on('reconnect', function () {
//     log('you have been reconnected');
//     if (username) {
//       socket.emit('add user', username);
//     }
//   });
//
//   socket.on('reconnect_error', function () {
//     log('attempt to reconnect has failed');
//   // });
//
// });
