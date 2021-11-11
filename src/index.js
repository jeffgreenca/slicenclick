import { randomInt } from 'crypto';
import Phaser from 'phaser';
import logoImg from './assets/logo.png';

class MyGame extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.image('logo', logoImg);
    }
      
    create ()
    {
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
        this.lastPos = {x: -1, y: -1};
        this.lineColor = 0xf807cc;
    }

    preload() {

    }

    create() {
        this.input.on(Phaser.Input.Events.POINTER_DOWN, this.click, this)

        for (let index = 0; index < 15; index++) {
            let x = this.randomIntFromInterval(0,1024);
            let y = this.randomIntFromInterval(0,768);
            let r = this.randomIntFromInterval(8,65);
            let c = this.add.circle(x, y, r, 0x0808ee);
            // let c = this.add.circle(x, y, r, this.randomIntFromInterval(10000,65500));
            this.tweens.add({
                targets: [c],
                scale: 1.05,
                yoyo: true,
                repeat: -1,
                duration: this.randomIntFromInterval(2000,3000),
                ease: 'Sine.easeInOut',
                delay: this.randomIntFromInterval(0,3000)
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
        let c = this.add.circle(pointer.worldX, pointer.worldY, 10, this.lineColor);
        this.tweens.add({
            targets: [c],
            scale: 0.5,
            yoyo: false,
            duration: 400,
            ease: 'Sine.easeInOut'
        });
        if (this.lastPos.x != -1) {
            // Nth click
            this.add.line(
                0,
                0,
                this.lastPos.x,
                this.lastPos.y,
                pointer.worldX, 
                pointer.worldY,
                this.lineColor,
            ).setOrigin(0)
        }
        this.lastPos.x = pointer.worldX;
        this.lastPos.y = pointer.worldY;
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1024,
    height: 768,
    scene: ClickLine
};

const game = new Phaser.Game(config);
