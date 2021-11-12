import { randomInt } from 'crypto';
import Phaser from 'phaser';
// import WinSound from './assets/audio/456965__funwithsound__short-success-sound-glockenspiel-treasure-video-game.mp3';
import WinSound from './assets/audio/387232__steaq__badge-coin-win.wav';
import LineSound from './assets/audio/344276__nsstudios__laser3.wav';
import HitSound from './assets/audio/323809__jact878787__cointojar.mp3';

const worldSize = { w: 1024, h: 768 };

const totalEnemies = 6;

class Alternative extends Phaser.Scene {

    constructor() {
        super();
        this.enemies = [];
        this.lastPos = { x: -1, y: -1 };
        this.lineColor = 0xf807cc;
        this.totalLines = 0;
        this.totalLineText = null;
    }

    preload() {
        this.load.audio("win", WinSound);
        this.load.audio("line", LineSound);
        this.load.audio("hit", HitSound);
    }

    create() {
        this.sound.pauseOnBlur = false;

        this.soundWin = this.sound.add("win", {loop: false});
        this.cameras.main.fadeFrom(800);

        for (var i = 0; i < totalEnemies; i++) {
            this.enemies.push(this.makeEnemy())
        }

        this.input.on(Phaser.Input.Events.POINTER_DOWN, this.click, this);
        this.add.text(0,0, "Lines:");
        this.totalLineText = this.add.text(150,0,this.totalLines);

        this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.restart());
    }

    restart () {
        this.enemies = []
        this.lastPos = { x: -1, y: -1 };
        this.lineColor = 0xf807cc;
        this.scene.restart();
    }

    click(pointer) {
        console.log(pointer);
        if (pointer.button !== 0) {
            return
        }
        // always do animation to show click
        let c = this.add.circle(pointer.worldX, pointer.worldY, 8, this.lineColor);
        this.tweens.add({
            targets: [c],
            scale: 0.4,
            yoyo: false,
            duration: 800,
            ease: Phaser.Math.Easing.Expo.Out,
        });
        if (this.lastPos.x != -1) {
            // Nth click
            let line = this.makeLine(this.lastPos.x, this.lastPos.y, pointer.worldX, pointer.worldY);
            this.sound.add("line", {loop: false}).play();

            // compute enemies hit
            let hits = this.enemies.filter((v) => Phaser.Geom.Intersects.LineToCircle(line.geom, v.geom));
            console.log("Hit ", hits.length);

            hits.forEach((v) => {
                if (v.hit) {
                    return
                }
                this.sound.add("hit").play({
                    delay: Phaser.Math.Between(0, 0.03),
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
            this.checkWin()
        }
        this.lastPos.x = pointer.worldX;
        this.lastPos.y = pointer.worldY;
    }

    makeLine(x1, y1, x2, y2) {
        let g = new Phaser.Geom.Line(x1, y1, x2, y2);
        let o = this.add.line(0, 0, g.x1, g.y1, g.x2, g.y2, this.lineColor).setOrigin(0).setLineWidth(3);
        this.totalLines++;
        this.totalLineText.setText(this.totalLines);
        this.tweens.add({
            targets: [o],
            duration: 1200,
            ease: Phaser.Math.Easing.Sine.Out,
            alpha: 0.5,
            lineWidth: 2
        });
        return {obj: o, geom: g}
    }

    makeEnemy() {
        let r = randInt(18,50);
        let g = new Phaser.Geom.Circle(randInt(r, worldSize.w - r), randInt(r, worldSize.h - r), r);
        let obj = this.add.circle(g.x, g.y, g.radius, 0x0066ff);
        return {obj: obj, geom: g, hit: false}
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
        this.cameras.main.shake(600, 0.002, false, (cam, done) => { 
            if (done > 0.3) {
                if (!this.soundWin.isPlaying) {
                    this.soundWin.play();
                }
                this.cameras.main.fade(2000, 255,255,255) 
            } 
        });
    }

    render () {
    }
}

function randInt(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
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
    scene: Alternative
};

const game = new Phaser.Game(config);
