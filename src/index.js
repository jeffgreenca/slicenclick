import Phaser from 'phaser';
// import WinSound from './assets/audio/456965__funwithsound__short-success-sound-glockenspiel-treasure-video-game.mp3';
import WinSound from './assets/audio/387232__steaq__badge-coin-win.wav';
import FireSound from './assets/audio/344276__nsstudios__laser3.wav';
import HitSound from './assets/audio/323809__jact878787__cointojar.mp3';
import White from './assets/images/white.png';
import Hedgehog from './assets/images/hedgehog.png';

const worldSize = { w: 1024, h: 768 };

const minEnemyCount = 2;
const hitsToWin = 20;

const KeySoundFire = "fire";

class BubbleGame extends Phaser.Scene {

    constructor() {
        super();
        this.enemies = [];
        this.lastPos = { x: -1, y: -1 };
        this.lineColor = 0xf807cc;
        this.totalLines = 0;
        this.totalHits = 0;
        this.lifetimeTotalLines = 0;
        this.lifetimeTotalHits = 0;
        this.level = 0;

        this.isPlaying = true;
        this.isMenu = false;
    }

    // main game functions

    preload() {
        this.load.audio("win", WinSound);
        this.load.audio(KeySoundFire, FireSound);
        this.load.audio("hit", HitSound);
        this.load.image("white", White);
        this.load.image("hedgehog", Hedgehog);
    }

    create() {
        this.sound.pauseOnBlur = false;

        this.bg = this.add.image(-20, -20, "white").setOrigin(0).setScale(game.renderer.width / 250, game.renderer.height / 150).setAlpha(0.8);
        this.refreshBackground()

        this.soundWin = this.sound.add("win", { loop: false });
        this.cameras.main.fadeFrom(800);

        let enemyCount = minEnemyCount + (Phaser.Math.Between(1, 2) * this.level)

        for (var i = 0; i < enemyCount; i++) {
            this.enemies.push(this.makeEnemy())
        }

        this.initMenu();

        this.cursor = this.add.circle(-50, -50, 4, 0x00ff00, 0.4);
        this.tracer = this.add.line(-1, -1, -1, -1, -1, -1, 0x00ff00, 0.4).setLineWidth(1).setOrigin(0);

        // this.add.text(5,5, "Lines").setShadow(0,0,'rgba(0,0,0,0.8)', 5);
        // this.totalLineText = this.add.text(105,5,this.totalLines).setShadow(2,2,'rgba(0,0,0,0.4)', 8);
        // this.add.text(5,22, "Sliced").setShadow(0,0,'rgba(0,0,0,0.8)', 5);
        // this.totalHitsText = this.add.text(105,22,this.totalHits).setShadow(2,2,'rgba(0,0,0,0.4)', 8);

        this.info = this.add.text(game.renderer.width / 2, game.renderer.height / 2, "Click to start", {
            color: "#ffffff",
            fontSize: "50px",
        }).setOrigin(0.5).setShadow(5, 5, 'rgba(0,0,0,0.8)', 10);
        this.info.setVisible(!this.input.mouse.locked)

        this.input.on(Phaser.Input.Events.POINTER_MOVE, this.move, this);
        // this.input.on(Phaser.Input.Events.POINTER_DOWN, this.click, this);

        this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.advance());
    }

    // ---- event handlers
    move(pointer) {
        if (this.input.mouse.locked) {
            this.updateCursor(pointer);
            this.updateTracer();
        }
    }

    click(pointer) {
        if (this.isMenu) {
            // if menu is open, clicking is direct to gameobjects (I hope)
            return
        }
        if (!this.input.mouse.locked) {
            this.captureMouse(pointer);
            return;
        }
        if (this.isPlaying && pointer.button == 0) {
            this.fire();
            return
        }
    }

    // ---- game logic

    initMenu() {
        const offscreen = 100;
        let menu = [];
        // maybe scene.input.on('pointerdown', function(pointer, currentlyOver){ /* ... */ });
        menu.push(this.add.rectangle(offscreen, offscreen, 500, 200, 0xffffff, 1).setOrigin(0))
        menu.push(this.add.rectangle(offscreen + 10, offscreen + 10, 50, 50, 0xff0000, 1).setOrigin(0).setInteractive().on(Phaser.Input.Events.POINTER_DOWN, 
            function(pointer, gameObject){
                console.log("go", gameObject);
            }
            ))
        menu.push(this.add.rectangle(offscreen + 10 + 10 + 50, offscreen + 10, 50, 50, 0x0000ff, 1).setOrigin(0))
    }

    showMenu() {

    }

    hideMenu() {

    }

    fire() {
        this.initLastPos();
        this.resolveHits(this.playFire());
        this.updateLastPos();

        this.checkWin()
    }

    playFire() {
        let c = this.add.circle(this.cursor.x, this.cursor.y, 8, this.lineColor);
        this.tweens.add({
            targets: [c],
            scale: 0.4,
            yoyo: false,
            duration: 800,
            ease: Phaser.Math.Easing.Expo.Out,
        });
        let line = this.makeLine(this.lastPos.x, this.lastPos.y, this.cursor.x, this.cursor.y);
        this.sound.add(KeySoundFire, { loop: false }).play();
        return line;
    }

    updateCursor(pointer) {
        this.cursor.x += pointer.movementX;
        this.cursor.y += pointer.movementY;
        this.cursor.x = Phaser.Math.Clamp(this.cursor.x, 0, game.renderer.width);
        this.cursor.y = Phaser.Math.Clamp(this.cursor.y, 0, game.renderer.height);
    }

    updateTracer() {
        if (this.lastPos.x == -1) {
            return
        }
        this.tracer.setTo(this.lastPos.x, this.lastPos.y, this.cursor.x, this.cursor.y);
    }

    captureMouse(pointer) {
        this.input.mouse.requestPointerLock();
        this.cursor.x = pointer.worldX;
        this.cursor.y = pointer.worldY;
        this.info.setVisible(false);
    }

    updateLastPos() {
        this.lastPos.x = this.cursor.x;
        this.lastPos.y = this.cursor.y;
    }

    initLastPos() {
        if (this.lastPos.x == -1) {
            this.updateLastPos();
        }
    }

    resolveHits(line) {
        // compute enemies hit
        let hits = this.enemies.filter((v) => Phaser.Geom.Intersects.LineToCircle(line.geom, v.geom));

        hits.forEach((v) => {
            if (v.hit) {
                // already hit
                return
            }
            this.totalHits++;
            // this.totalHitsText.setText(this.totalHits);
            v.hitSound.play({
                delay: Phaser.Math.FloatBetween(0, 0.2),
            })
            v.hit = true;
            v.obj.fillColor = 0xff0000;
            v.obj.alpha = 0.8;
            this.tweens.add({
                targets: [v.obj],
                duration: 200,
                ease: Phaser.Math.Easing.Sine.InOut,
                alpha: 0.2,
            });
            this.tweens.add({
                targets: [v.obj],
                duration: 10000,
                ease: Phaser.Math.Easing.Sine.Out,
                scale: 0.2
            });
        });
    }


    advance() {
        // advance to the next level
        this.level++;
        this.enemies.forEach((x) => x.obj.destroy());
        this.enemies = []
        this.lastPos = { x: -1, y: -1 };
        this.lineColor = 0xf807cc; // TODO
        this.refreshBackground();
        this.scene.restart();
    }


    refreshBackground() {
        this.bg.clearTint();
        const max = 80;
        const min = 10;
        this.bg.setTint(
            Phaser.Display.Color.RandomRGB(min, max).color,
            Phaser.Display.Color.RandomRGB(min, max).color,
            Phaser.Display.Color.RandomRGB(min, max).color,
            Phaser.Display.Color.RandomRGB(min, max).color,
        )
    }

    makeLine(x1, y1, x2, y2) {
        let g = new Phaser.Geom.Line(x1, y1, x2, y2);
        let o = this.add.line(0, 0, g.x1, g.y1, g.x2, g.y2, this.lineColor).setOrigin(0).setLineWidth(3);
        this.totalLines++;
        // this.totalLineText.setText(this.totalLines);
        this.tweens.add({
            targets: [o],
            duration: 1200,
            ease: Phaser.Math.Easing.Sine.Out,
            alpha: 0.5,
            lineWidth: 2
        });
        return { obj: o, geom: g }
    }

    makeEnemy() {
        let r = Phaser.Math.Between(18, 50);
        let g = new Phaser.Geom.Circle(Phaser.Math.Between(r, worldSize.w - r), Phaser.Math.Between(r, worldSize.h - r), r);
        let obj = this.add.circle(g.x, g.y, g.radius, 0x0066ff);
        let h = this.sound.add("hit");
        return { obj: obj, geom: g, hit: false, hitSound: h }
    }

    checkWin() {
        if (this.enemies.length == 0) {
            console.warn("checkWin called but empty enemies, not recording win");
            return
        }
        if (this.enemies.filter((v) => !v.hit).length > 0) {
            // enemies still exist
            return
        }
        // WIN... of some sort so do recordkeeping
        this.lifetimeTotalHits += this.totalHits;
        this.lifetimeTotalLines += this.totalLines;

        if (this.totalHits > hitsToWin) {
            // win - game over
            this.add.image(game.renderer.width / 2, game.renderer.height / 2, "hedgehog").setOrigin(0.5);
            this.add.text(game.renderer.width / 2, game.renderer.height / 2, "You Win!").setOrigin(0.5).setFontSize(50).setShadow(1, 1, 'rgba(0,0,0,0.4)', 6);
            this.soundWin.play();
            this.cameras.main.shake(1200, 0.002, false)
            this.tracer.setVisible(false)
            this.input.mouse.releasePointerLock();
            return
        }
        // win - advance to next level
        this.soundWin.play();
        this.cameras.main.shake(600, 0.002, false, (cam, done) => {
            if (done > 0.3) {
                this.cameras.main.fade(2000, 255, 255, 255)
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    backgroundColor: 0x202020,
    parent: 'game',
    width: worldSize.w,
    height: worldSize.h,
    scale: {
        // mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: BubbleGame
};

const game = new Phaser.Game(config);
