import { randomInt } from 'crypto';
import Phaser from 'phaser';
import logoImg from './assets/logo.png';

const worldSize = { w: 1024, h: 768 };

class MyGame extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        this.load.image('logo', logoImg);
    }

    create() {
        const logo = this.add.image(400, 150, 'logo');

        this.tweens.add({
            targets: logo,
            y: 450,
            duration: 2000,
            ease: "Power2",
            yoyo: true,
            loop: -1
        });
    }
}

class ClickLine extends Phaser.Scene {
    constructor() {
        super();
        this.lastPos = { x: -1, y: -1 };
        this.lineColor = 0xf807cc;
        this.lineWidth = 2;
        this.enemies = [];
    }

    preload() {

    }

    create() {
        this.matter.world.setBounds(0, 0, worldSize.w, worldSize.h);
        this.input.on(Phaser.Input.Events.POINTER_DOWN, this.click, this)

        // HERE see https://www.codeandweb.com/physicseditor/tutorials/how-to-create-physics-shapes-for-phaser-3-and-matterjs
        // and https://github.com/photonstorm/phaser3-examples/blob/master/public/src/physics/arcade/sprite%20overlap%20group.js

        for (let index = 0; index < 15; index++) {
            let x = this.randomIntFromInterval(0, worldSize.w);
            let y = this.randomIntFromInterval(0, worldSize.h);
            let r = this.randomIntFromInterval(8, 65);
            let c = this.add.circle(x, y, r, 0x0808ee);
            this.matter.add.circle(x,y,r, {isStatic: true, isSensor: true});
            this.enemies.push(c)
            this.tweens.add({
                targets: [c],
                scale: 1.05,
                yoyo: true,
                repeat: -1,
                duration: this.randomIntFromInterval(2000, 3000),
                ease: Phaser.Math.Easing.Sine.InOut,
                delay: this.randomIntFromInterval(0, 3000)
            });
        }

    }
    randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    update() {

    }

    render() {

    }

    click(pointer) {
        console.log(pointer);
        if (pointer.button !== 0) {
            return
        }
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
            let line = this.add.line(
                0,
                0,
                this.lastPos.x,
                this.lastPos.y,
                pointer.worldX,
                pointer.worldY,
                this.lineColor,
            ).setOrigin(0).setLineWidth(this.lineWidth);
            this.matter.add.gameObject(line, {isSensor: true, isStatic: true});
            // this.matter.add.gameObject(line);
            // this.physics.world.overlap(line, this.enemies, this.collide)
        }
        this.lastPos.x = pointer.worldX;
        this.lastPos.y = pointer.worldY;
    }

    collide(e) {
        console.log("COLLISION", e);
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
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                y: 0,
                x: 0,
            },
            debug: true,
        }

    },
    scene: ClickLine
};

const game = new Phaser.Game(config);
