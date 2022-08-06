import { Room } from "@colyseus/core";
import { MapSchema, Schema, type} from '@colyseus/schema'

class Player extends Schema {}
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "rotation");

class Bullet extends Schema {}
type("number")(Bullet.prototype, "x");
type("number")(Bullet.prototype, "y");
type("number")(Bullet.prototype, "angle");
type("number")(Bullet.prototype, "speed_x");
type("number")(Bullet.prototype, "speed_y");
type("number")(Bullet.prototype, "index");


class State extends Schema {
    constructor() {
        super();

        this.players = new MapSchema();
        this.bullets = new MapSchema();
        this.nextPosition = 0;
        this.bullet_index = 0;
    }
    getNextPosition() {
        const position = (this.nextPosition % 4) + 1;
        ++this.nextPosition;
        return position;
    }
    createBullet(id, data) {
        let bullet = new Bullet();
        bullet.index = this.bullet_index;
        bullet.x = data.x;
        bullet.y = data.y;
        bullet.angle = data.angle;
        bullet.speed_x = data.speed_x;
        bullet.speed_y = data.speed_y;
        bullet.distanceTravelled = 0;
        bullet.owner_id = id;
        this.bullets[this.bullet_index++] = bullet;
    }
    moveBullet(index) {
        const old_x = this.bullets[index].x;
        const old_y = this.bullets[index].y;

        this.bullets[index].x -= this.bullets[index].speed_x;
        this.bullets[index].y -= this.bullets[index].speed_y;

        const dx = this.bullets[index].x - old_x;
        const dy = this.bullets[index].y - old_y;

        this.bullets[index].distanceTravelled += Math.sqrt(dx * dx + dy * dy);
    }
    removeBullet(index) {
        delete this.bullets[index];
    }
    createPlayer(id) {
        this.players[id] = new Player();
    }
    getPlayer(id) {
        return this.players[id];
    }
    newPlayer(id) {
        return this.players[id];
    }
    removePlayer(id) {
        delete this.players[id];
    }
    setPlayerPosition(id, position) {
        this.players[id].x = position.x;
        this.players[id].y = position.y;
    }
    movePlayer(id, movement) {
        let player = this.players[id];
        player.x = movement.x;
        player.y = movement.y;
        player.rotation = movement.rotation
    }
}

type({ map: Player })(State.prototype, "players");
type({ map: Bullet })(State.prototype, "bullets");

export class Outdoor extends Room {
    onInit() {
        this.setState(new State());
        this.clock.setInterval(this.ServerGameLoop.bind(this), 16);
    }

    onCreate() {
        this.setState(new State());
        this.clock.setInterval(this.ServerGameLoop.bind(this), 16);
    }

    onJoin(client) {
        let nextPosition = this.state.getNextPosition();
        this.state.createPlayer(client.sessionId);

        client.send("start_position", {
            position: nextPosition
        });

        this.broadcast("new_player", {
            position: nextPosition,
            id: client.sessionId
        }, {
            except: client
        });
    }

    onMessage(client, message) {
        console.log('client => ', client)
        console.log('message => ', message)
        if (
            ["initial_position", "move", "shoot_bullet", "0"].includes(message.action) &&
            this.state.getPlayer(client.sessionId) == undefined
        ) return;

        switch (message.action) {
            case "0":
                console.log('client => ', client)
                console.log('message => ', message)
                break;
            case "initial_position":
                this.state.setPlayerPosition(client.sessionId, message.data);
                break;
            case "move":
                this.state.movePlayer(client.sessionId, message.data);
                break;
            case "shoot_bullet":
                if (Math.abs(message.data.speed_x) <= 100 && Math.abs(message.data.speed_y) <= 100) {
                    this.state.createBullet(client.sessionId, message.data);
                }
                break;
            default:
                break;
        }
    }
    onLeave(client, consented) {
        this.state.removePlayer(client.sessionId);
    }

    onDispose() {}

    // Update the bullets 60 times per frame and send updates
    ServerGameLoop() {
        for (let i in this.state.bullets.keys()) {
            this.state.moveBullet(i);
            //remove the bullet if it goes too far
            if (
                this.state.bullets[i].x < -10 ||
                this.state.bullets[i].x > 3200 ||
                this.state.bullets[i].y < -10 ||
                this.state.bullets[i].y > 3200 ||
                this.state.bullets[i].distanceTravelled >= 800
            ) {
                this.state.removeBullet(i);
            } else {
                //check if this bullet is close enough to hit a player
                for (let id in this.state.players.keys()) {
                    if (this.state.bullets[i].owner_id != id) {
                        //because your own bullet shouldn't kill hit
                        const dx = this.state.players[id].x - this.state.bullets[i].x;
                        const dy = this.state.players[id].y - this.state.bullets[i].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 30) {
                            this.broadcast("hit", {
                                punished_id: id,
                                punisher_id: this.state.bullets[i].owner_id
                            });
                            this.state.removeBullet(i);
                            this.state.removePlayer(id);
                            return;
                        }
                    }
                }
            }
        }
    }
}
