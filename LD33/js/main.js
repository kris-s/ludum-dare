var worldDimensions = {x: 800, y: 600};

var game = new Phaser.Game(worldDimensions.x, worldDimensions.y, Phaser.AUTO, '',
    { preload: preload, create: create, update: update });


function preload() {
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    game.load.audio('music', 'assets/music.mp3')

    game.load.image('space', 'assets/background.png');
    game.load.image('star', 'assets/star.png');
    game.load.image('shot', 'assets/shot.png');
    game.load.image('target', 'assets/target.png');
    game.load.image('player', 'assets/player.png');
    game.load.image('redshot', 'assets/redshot.png');

    game.load.bitmapFont('nokia', 'assets/font/nokia.png', 'assets/font/nokia.xml');
}

var player;
var cursors;
var debugText;
var playerAcceleration = 50;
var bmpText;
var bulletTime = 0;
var room = 1;
var advanceRoomId = 0;
var unlocked = true;
var musicMuted = false;

var spacing = {
    3: {
        targetXbase: 180,
        targetX: 200,
        targetY: 200
    },
    2: {
        targetXbase: 180,
        targetX: 400,
        targetY: 200
    },
    1: {
        targetXbase: 380,
        targetX: 200,
        targetY: 200
    }
};

function create() {

    // WORLD
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, worldDimensions.x, worldDimensions.y);
    game.add.sprite(0, 0, 'space');

    // STARS
    var emitter = game.add.emitter(game.world.centerX, 0, 400);
    emitter.width = game.world.width;
    emitter.makeParticles('star');
    emitter.minParticleScale = 0.25;
    emitter.maxParticleScale = 1.0;
    emitter.setYSpeed(50, 200);
    emitter.setXSpeed(-5, 5);
    emitter.minRotation = 0;
    emitter.maxRotation = 0;
    emitter.start(false, 2000, 250, 0);

    // TEXT
    bmpText = game.add.bitmapText(85, 75, 'nokia', '', 24);
    flavorText = game.add.bitmapText(225, 305, 'nokia', '', 24);
    option1 = game.add.bitmapText(195, 205, 'nokia', '1', 40);
    option2 = game.add.bitmapText(395, 205, 'nokia', '2', 40);
    option3 = game.add.bitmapText(595, 205, 'nokia', '3', 40);

    // PLAYER
    player = game.add.sprite(32, game.world.height - 40, 'player');
    player.anchor.setTo(0.5, 0.5);
    game.camera.follow(player);
    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;

    // BULLETS
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(2, 'shot');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    redBullets = game.add.group();
    redBullets.enableBody = true;
    redBullets.physicsBodyType = Phaser.Physics.ARCADE;
    redBullets.createMultiple(2, 'redshot');
    redBullets.setAll('anchor.x', 0.5);
    redBullets.setAll('anchor.y', 1);
    redBullets.setAll('outOfBoundsKill', true);
    redBullets.setAll('checkWorldBounds', true);


    // TARGETS
    targets = game.add.group();
    targets.enableBody = true;
    targets.physicsBodyType = Phaser.Physics.ARCADE;
    drawTargets();


    // MUSIC
    music = game.add.audio('music');
    music.loop = true;
    music.play();
    
    // INPUT
    cursors = game.input.keyboard.createCursorKeys();
    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    mute = game.input.keyboard.addKey(Phaser.Keyboard.M);
    
}

function update() {

    if (flavorText.alpha > 0) {
        flavorText.alpha -= 0.003;
    }

    if (cursors.up.isDown || space.isDown) {
        fireBullet();
    }

    if (cursors.left.isDown) {
        if (player.body.velocity.x > -6 * playerAcceleration){
            player.body.velocity.x -= playerAcceleration;
        }
        // player.animations.play('left');
    } else if (cursors.right.isDown) {
        if (player.body.velocity.x < 6 * playerAcceleration){
            player.body.velocity.x += playerAcceleration;
        }
        // player.animations.play('right');
    } else {
        if (player.body.velocity.x > 0) {
            player.body.velocity.x -= playerAcceleration;
        }
        else if (player.body.velocity.x < 0) {
            player.body.velocity.x += playerAcceleration;
        }

        player.animations.stop();
        player.frame = 4;
    }

    game.physics.arcade.overlap(bullets, targets, collisionHandler, null, this);
    game.physics.arcade.overlap(redBullets, targets, collisionHandler, null, this);
}

function fireBullet () {
    if (room > 13) {
        if (game.time.now > bulletTime) {
            bullet = redBullets.getFirstExists(false);

            if (bullet) {
                bullet.reset(player.x, player.y + 8);
                bullet.body.velocity.y = -300;
                bulletTime = game.time.now + 200;
            }
        }
    } else {
        if (game.time.now > bulletTime) {
            bullet = bullets.getFirstExists(false);

            if (bullet) {
                bullet.reset(player.x, player.y + 8);
                bullet.body.velocity.y = -300;
                bulletTime = game.time.now + 200;
            }
        }
    }

}

function collisionHandler (bullet, target) {

    bullet.kill();
    target.kill();

    flavorText.text = roomLibrary[room].flavor[target.id];
    flavorText.alpha = 1.0;

    if (target.id === advanceRoomId && unlocked) {
        unlocked = false;
        game.time.events.add(Phaser.Timer.SECOND, unlockRoom, this);
        room++;
        targets.forEach(function(item) {
            item.kill();
        });
        game.time.events.add(Phaser.Timer.SECOND, drawTargets, this);
        if (room === 18) {
            player.kill();
        }
    } else {
        unlocked = false;
        game.time.events.add(Phaser.Timer.SECOND, unlockRoom, this);
        room = 2;
        targets.forEach(function(item) {
            item.kill();
        });
        game.time.events.add(Phaser.Timer.SECOND, drawTargets, this);
    }
}

function unlockRoom() {
    unlocked = true;
}

function drawTargets() {
    var roomData = roomLibrary[room];
    var optionMode = spacing[roomData.optionCount];
    advanceRoomId = roomData.correct;
    option1.text = roomData.options[0];
    option2.text = roomData.options[1];
    option3.text = roomData.options[2];

    for (var i = 0; i < roomData.optionCount; i++) {

        target = game.add.sprite(
            optionMode.targetXbase + (optionMode.targetX * i),
            optionMode.targetY, 'target');
        target.id = i;
        targets.add(target);
    }
    bmpText.text = roomLibrary[room].text;
}

function toggleMusic() {
    if (musicMuted) {
        music.resume();
        musicMuted = false;
    } else {
        music.pause();
        musicMuted = true;
    }
}

var roomLibrary = {
    1: {
        text: 'You volunteered for this.',
        optionCount: 1,
        correct: 0,
        options: [
            '',
            'C',
            '',
        ],
        flavor: [
            'Continue.',
        ],
    },
    2: {
        text: 'You aren\'t the only one.',
        optionCount: 1,
        correct: 0,
        options: [
            '',
            'C',
            '',
        ],
        flavor: [
            'Continue.',
        ],
    },
    3: {
        text: 'We\'ll need to test you, mind and heart.',
        optionCount: 1,
        correct: 0,
        options: [
            '',
            'C',
            '',
        ],
        flavor: [
            'Continue.',
        ]
    },
    4: {
        text: 'You come to a fork in the road, the road sign says\n your destination is to the left. Which way do you go?',
        optionCount: 2,
        correct: 0,
        options: [
            'L',
            '',
            'R'
        ],
        flavor: [
            'Left: you\'re one step closer.',
            'Right: This isn\'t the way.',
        ]
    },
    5: {
        text: 'If I have two, I\'m half way there. What is it?',
        optionCount: 3,
        correct: 1,
        options: [
            'A',
            'Q',
            'D',
        ],
        flavor: [
            '',
            'Quarter: moons and fractions and dollars.',
            '',
        ]
    },
    6: {
        text: 'An organism has a sickly growth,\n should you cut out the growth?',
        optionCount: 2,
        correct: 0,
        options: [
            'Y',
            '',
            'N',
        ],
        flavor: [
            'Yes: a small price to pay for survival.',
            'No: you spare short term pain and watch\n as the organism is overwhelmed.',
        ]
    },
    7: {
        text: 'It burns, it turns, it is a lifegiver.',
        optionCount: 3,
        correct: 1,
        options: [
            'V',
            'S',
            'L',
        ],
        flavor: [
            '',
            'Stars: we are made of their dead\n and fueled by their living.',
            '',
        ]
    },
    8: {
        text: 'Your ship is taking on water, what do you do?',
        optionCount: 2,
        correct: 1,
        options: [
            'A',
            '',
            'F',
        ],
        flavor: [
            'Abandon: leaving your safe haven\n is ill advised.',
            'Fix: the leak is stopped, you are safe.',
        ],
    },
    9: {
        text: 'It has six sides, it has twenty and one.',
        optionCount: 3,
        correct: 2,
        options: [
            'H',
            'B',
            'D',
        ],
        flavor: [
            '',
            '',
            'Die: chance and death are merry\n with their mischief.',
        ],
    },
    10: {
        text: 'Crossing the desert, a member of your party takes ill.\n What do you do?',
        optionCount: 2,
        correct: 1,
        options: [
            'S',
            '',
            'A',
        ],
        flavor: [
            'Save: the burden is too great\n and your party succumbs to the elements.',
            'Abandon: hope is lost for one, but not all.',
        ],
    },
    11: {
        text: 'King of keyboards and the heavens alike.',
        optionCount: 3,
        correct: 2,
        options: [
            'E',
            'X',
            'S',
        ],
        flavor: [
            '',
            '',
            'Space: leave room for nothing.'
        ],
    },
    12: {
        text: 'You\'re the one we need.',
        optionCount: 1,
        correct: 0,
        options: [
            '',
            'Y',
            '',
        ],
        flavor: [
            'Yes.'
        ],
    },
    13: {
        text: 'You will do what is necessary.',
        optionCount: 1,
        correct: 0,
        options: [
            '',
            'Y',
            '',
        ],
        flavor: [
            'Yes.'
        ],
    },
    14: {
        text: 'Kill all of the rebels.',
        optionCount: 2,
        correct: 0,
        options: [
            'Y',
            '',
            'N',
        ],
        flavor: [
            'Sacrifice the few to save the many.',
            'We\'ll find someone who has true courage.',
        ],
    },
    15: {
        text: 'There are three rebel bases.',
        optionCount: 1,
        correct: 0,
        options: [
            '',
            '3',
            '',
        ],
        flavor: [
            'The unsuspecting rebels are no match\n for your ship\'s firepower.'
        ],
    },
    16: {
        text: 'There are two rebel bases.',
        optionCount: 1,
        correct: 0,
        options: [
            '',
            '2',
            '',
        ],
        flavor: [
            'Even on high alert, the rebels cannot\n stop your new weaponry.'
        ],
    },
    17: {
        text: 'The rebels are against the wall. Only one base remains.\n There are families here.',
        optionCount: 1,
        correct: 0,
        options: [
            '',
            '1',
            '',
        ],
        flavor: [
            'You hope this will bring peace.'
        ],
    },
    18: {
        text: 'Your crusade against the rebels will not be forgotten.',
        optionCount: 0,
        correct: 0,
        options: [
            '',
            '',
            '',
        ],
        flavor: [
            ''
        ],
    },
};
