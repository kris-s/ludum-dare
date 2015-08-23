var game = new Phaser.Game(1280, 720, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
    game.load.image('world', 'assets/world.png');
    game.load.image('ground', 'assets/road.png');
    game.load.image('red','assets/redstatic.png');
    game.load.image('yellow', 'assets/yellow.png');
    game.load.image('orange', 'assets/orange.png');
    game.load.image('green', 'assets/green.png');
    game.load.image('blue', 'assets/blue.png');
    game.load.image('purple', 'assets/purple.png');
    game.load.spritesheet('player', 'assets/red.png', 32, 48);
    game.load.image('bottle', 'assets/bottle.png');
    game.load.image('dye', 'assets/dye.png');
    game.load.audio('music', 'assets/music.mp3');
}

var player;
var cursors;
var yellow;
var score = 0;
// var debugText;
var storyText;
var worldWidth = 15360;
var playerAcceleration = 25;
var startFinalScene = false;
var continueFinalScene = false;
var animateBottle = false;
var killedBottle = false;
var timeToGo = false;
var recordTime = true;
var spawnDye = false;
var canSpin = true;
var stretchDye = false;
var time = 0;
var dyeX = 1;
var dyeY = 1;

var charPos = {'orange': 3950,
               'yellow': 6580,
               'green': 9165,
               'blue': 11255,
               'purple': 14770};

var story = {'orange': 'I guess it\'s time then.',
             'yellow': 'Hey Red! It will be okay; see you there!',
             'green': 'The trees are strong, they will endure.',
             'blue': 'We will honor this world by doing our duty.',
             'purple': 'Let it be done.',
             'orange2': 'I hope it doesn\'t hurt.',
             'purple2': 'Even if it does, it will be worth it.'};

function create() {
    //WORLD
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, worldWidth, 720);
    game.add.tileSprite(0, 0, 15360, 720, 'world');

    platforms = game.add.group();
    platforms.enableBody = true;

    music = game.add.audio('music');
    music.volume = 0.1;
    music.loop = true;
    music.play();


    var ground = platforms.create(0, game.world.height - 12, 'ground');
    ground.scale.setTo(40, 1);
    ground.body.immovable = true;

    //NPCs
    characters = game.add.group();
    characters.enableBody = true;

    yellow = characters.create(charPos.yellow, game.world.height - 120, 'yellow');
    yellow.body.gravity.y = 300;
    yellow.body.collideWorldBounds = true;

    orange = characters.create(charPos.orange, game.world.height - 120, 'orange');
    orange.body.gravity.y = 300;
    orange.body.collideWorldBounds = true;

    green = characters.create(charPos.green, game.world.height - 120, 'green');
    green.body.gravity.y = 300;
    green.body.collideWorldBounds = true;

    blue = characters.create(charPos.blue, game.world.height - 120, 'blue');
    blue.body.gravity.y = 300;
    blue.body.collideWorldBounds = true;

    purple = characters.create(charPos.purple, game.world.height - 120, 'purple');
    purple.body.gravity.y = 300;
    purple.body.collideWorldBounds = true;

    //PLAYER
    player = game.add.sprite(32, game.world.height - 64, 'player');
    player.anchor.setTo(0.5, 0.5);
    game.camera.follow(player);
    game.physics.arcade.enable(player);
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;
    player.animations.add('left', [0, 1, 2, 3], 4, true);
    player.animations.add('right', [5, 6, 7, 8], 4, true);

    // debugText = game.add.text(16, 16, '', { font: '12px Courier New', fill: '#000' });
    storyText = game.add.text(300, 640, '', { font: '14px Andale Mono', fill: '#000' });

    cursors = game.input.keyboard.createCursorKeys();
    
}

function update() {
    time += 1;
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(characters, platforms);

    // debugText.text = 'x: ' + player.position.x + ' y: ' + player.position.y;
    // debugText.position.x = player.position.x;

    if (player.position.x > charPos.orange - 50 && player.position.x < charPos.orange) {
        storyText.position.x = charPos.orange;
        storyText.text = story.orange;
    } else if (player.position.x > charPos.yellow - 50 && player.position.x < charPos.yellow) {
        storyText.position.x = charPos.yellow;
        storyText.position.y = 620;
        storyText.text = story.yellow;
    } else if (player.position.x > charPos.green - 50 && player.position.x < charPos.green) {
        storyText.position.x = charPos.green;
        storyText.position.y = 630;
        storyText.text = story.green;
    } else if (player.position.x > charPos.blue - 50 && player.position.x < charPos.blue) {
        storyText.position.x = charPos.blue;
        storyText.position.y = 630;
        storyText.text = story.blue;
    } else if (player.position.x > charPos.purple - 50 && player.position.x < charPos.purple) {
        storyText.position.x = charPos.purple;
        storyText.position.y = 630;
        storyText.text = story.purple;
        if (!startFinalScene) {
            finalScene();
            startFinalScene = true;
        }
    } else if (player.position.x > 15020 && !continueFinalScene){
        continueFinalScene = true;
        continueFinal();
    } else {
        storyText.text = '';
    }

    if (cursors.left.isDown) {
        if (player.body.velocity.x > -6 * playerAcceleration){
            player.body.velocity.x -= playerAcceleration;
        }
        player.animations.play('left');
    } else if (cursors.right.isDown) {
        if (player.body.velocity.x < 6 * playerAcceleration){
            player.body.velocity.x += playerAcceleration;
        }
        player.animations.play('right');
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

    if (animateBottle) {
        if (bottle.position.x < 14900 && !killedBottle) {
            killedBottle = true;
            bottle.destroy();
            newBottle = game.add.sprite(14900, 600, 'bottle');
            timeToGo = true;
            animateBottle = false;
        }
    }

    if (timeToGo) {
        storyText.text = story.orange2;
        storyText.position.x = 14820;
        if (recordTime) {
            timeStart = time;
            recordTime = false;
        } else if (timeStart + 100 < time) {
            storyText.text = ''
            if (timeStart + 200 < time && canSpin) {
                canSpin = false;
                game.add.tween(newBottle).to({angle: 180}, 2000, Phaser.Easing.Linear.None, true);
                spawnDye = true;
            }
        }
        // console.log(time);
    }

    if (spawnDye) {
        spawnDye = false;
        dye = game.add.sprite(14902, 600, 'dye');
        stretchDye = true;
        dye.scale.setTo(dyeX, dyeY);
    }

    if (stretchDye) {
        dyeX += 1;
        dyeY += 1;
        dye.scale.setTo(dyeX, dyeY);
        dye.position.x -= dyeX/100;
        if (dyeX > 200) {
            stretchDye = false;
            purple.destroy();
            newBlue.destroy();
            newGreen.destroy();
            newYellow.destroy();
            newOrange.destroy();
            newRed.destroy();
            newBottle.destroy();
            dye.destroy();
        }   
    }
 }

function finalScene() {
    orange.destroy();
    yellow.destroy();
    green.destroy();
    blue.destroy();

    newBlue = characters.create(14820, 64, 'blue');
    newBlue.body.gravity.y = 200;
    newBlue.body.collideWorldBounds = true;
    newGreen = characters.create(14820+48, 64, 'green');
    newGreen.body.gravity.y = 175;
    newGreen.body.collideWorldBounds = true;
    newYellow = characters.create(14820+96, 64, 'yellow');
    newYellow.body.gravity.y = 150;
    newYellow.body.collideWorldBounds = true;
    newOrange = characters.create(14820+144, 64, 'orange');
    newOrange.body.gravity.y = 125;
    newOrange.body.collideWorldBounds = true;
}

function continueFinal() {
    player.destroy();
    newRed = characters.create(15000, 660, 'red');
    newRed.body.gravity.y = 300;
    newRed.body.collideWorldBounds = true;
    
    bottle = characters.create(15020, 660, 'bottle');
    bottle.collideWorldBounds = true;
    bottle.body.gravity.y = -5;
    bottle.body.gravity.x = -10;
    animateBottle = true;
}
