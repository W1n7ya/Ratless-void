import { Keybind } from "../../KeybindFix";
import { KeyBinding } from "./mappings";
import { data, isLogging } from "../utils/configutils";
import { C06PacketPlayerPosLook, MouseEvent } from "./mappings";
import playerUtils from "./playerUtils";
import rotationUtils from "./rotationUtils";
import config from "../config";
import dungeonUtils from "./dungeonUtils";
import { lavaClip } from "../features/lavaClip";
import S02Event from "../events/packets/server/S02Event";
import S2DEvent from "../events/packets/server/S2DEvent";
import S08Event from "../events/packets/server/S08Event";
import DeathTickEvent from "../events/packets/custom/DeathTickEvent";
import EveryoneLeapedEvent from "../events/packets/custom/EveryoneLeapedEvent";

let startedGoldor = false;
let openedTerm = false;
let everyoneLeaped = false;
let finishedI1 = false;
let waitingFlag = false;
let flagged = false;
let waitingTick = false;
let motionNode = null;
let lastBlink = 0;
let walking = false;
let continuousMotion = false;
let motionDirection = null;
let continuousMx = 0;
let continuousMz = 0;
let airTicks = 0;
let motionJumpDist = 1;
let jumping = false;
const forwardKey = Client.getKeyBindFromKey(Keyboard.KEY_W);
const sprintMult = 1.3;
let stopwatchStartTime = null;
let stopwatchRunning = false;
const mc = Client.getMinecraft().func_175598_ae()

register("renderWorld", () => {
    if (playerUtils.inP3) startedGoldor = true;

    if (!config().autoP3 || global.inFreeCam || Client.isInChat()) {
        if (walking) {
            forwardKey.setState(false);
            walking = false;
        }
        if (continuousMotion) {
            continuousMotion = false;
            motionDirection = null;
            continuousMx = 0;
            continuousMz = 0;
        }
        return;
    }
    if (config().disableAfterGoldor && startedGoldor && !playerUtils.inP3) return;

    Object.entries(data.points).forEach(([cfg, points]) => {
        if (cfg != data.config) return;

        points.forEach(point => {
            let { room, coords, rotation, type, raytrace, radius, argz, packets, speed } = point;
            if (room != dungeonUtils.getRoomName() && Server.getIP() != "localhost") return;

            if (dungeonUtils.isDungeonPoint(room)) {
                coords = dungeonUtils.getRealCoords(...coords);
                rotation = [dungeonUtils.getRealYaw(rotation[0]), rotation[1]];
                raytrace = dungeonUtils.getRealCoords(...raytrace);
            }

            const distance = playerUtils.getRenderDistance(...coords);

            if (distance <= radius) {
                const argzStr = (typeof point.argz === 'string' ? point.argz : '').toLowerCase();
                const argsList = argzStr.length ? argzStr.split(/\s+/) : [];

                if (type === "motion" && argsList.includes("awaitclick")) {
                    if (!point.awaitingClick) {
                        point.awaitingClick = true;
                        return;
                    }
                    if (point.awaitingClick) {
                        delete point.awaitingClick;
                    }
                } else {
                    if (type === "motion") {
                        if (point.near) return;
                    } else {
                        if (point.near) return;
                    }
                }

                const delay = point.type === "blink" && Date.now() - lastBlink < 150;

                let requiredWindowId = null;
                for (var i = 0; i < argsList.length; i++) {
                    if (argsList[i].startsWith("windowid=")) {
                        requiredWindowId = parseInt(argsList[i].slice(9));
                        if (isNaN(requiredWindowId)) requiredWindowId = null;
                    }
                }

                if ((argsList.includes("awaitterm") || requiredWindowId !== null) && (!openedTerm || delay)) {
                    if (!sentAwaitTermMessage) {
                        playerUtils.sendMessage("&b&lAwaiting " + (requiredWindowId !== null ? "Window ID " + requiredWindowId : "Term") + "/Click!");
                        sentAwaitTermMessage = true;
                    }
                    return;
                } else {
                    sentAwaitTermMessage = false;
                }

                if (argsList.includes("awaiti1") && !finishedI1) return;
                if (argsList.includes("awaitleap") && !everyoneLeaped) return;

                if (type === "motion" && argsList.includes("awaitclick")) {
                    if (point.awaitingClick) return;
                    point.near = true;
                } else if (!argsList.includes("awaitclick") || type !== "motion") {
                    point.near = true;
                }

                if (type == "blink" && packets.length > global.balancePackets) return playerUtils.sendMessage("&7Not enough balanced packets");
                if (config().sendMessages && !["blink", "text"].includes(type)) playerUtils.sendMessage(`&fUsing &7&l${type}`);

                switch (type) {
                    case "stop": {
                        if (argsList.includes("align")) {
                            playerUtils.setPosition(coords[0], Player.getY(), coords[2]);
                            playerUtils.sendDebugMessage("align");
                        }
                        if (argsList.includes("rotate")) {
                            rotationUtils.rotate(rotation[0], rotation[1]);
                            playerUtils.sendDebugMessage("rotate");
                        }
                        if (walking) {
                            forwardKey.setState(false);
                            walking = false;
                        }
                        if (continuousMotion) {
                            continuousMotion = false;
                            motionDirection = null;
                            continuousMx = 0;
                            continuousMz = 0;
                        }
                        playerUtils.stopMovement();
                        playerUtils.setMotion(0, Player.getMotionY(), 0);
                        motionNode = null;
                        break;
                    }
                    case "edge": {
                        edgeJump = register("renderOverlay", () => {
                            let [x, y, z] = [mc.field_78730_l, mc.field_78731_m, mc.field_78728_n]
                            let ID = World.getBlockAt(Player.getX(), Player.getY() - 0.1, Player.getZ()).type.getID()
                            if (ID == 0) {
                            playerUtils.jump();
                            jumping = true;
                                edgeJump.unregister()
                            }
                        }).unregister()

                        edgeJump.register()
                        break;
                    }

                    case "rotate": {
                        playerUtils.sendDebugMessage(`&7yaw:${rotation[0]}, pitch:${rotation[1]}`);
                        rotationUtils.rotate(...rotation);
                        break;
                    }
                    case "bhop": {
                        playerUtils.stopMovement();
                        walking = false;
                    
                        // Align
                        if (coords && coords.length >= 3) {
                            playerUtils.setPosition(coords[0], Player.getY(), coords[2]);
                            playerUtils.setMotion(0, Player.getMotionY(), 0);
                        }

                        // Jump
                        if (Player.asPlayerMP().isOnGround()) {
                            playerUtils.jump();
                            jumping = true;
                        }
                    
                        // Use point-specific yaw and pitch
                        const yaw = point.rotation && typeof point.rotation[0] === "number"
                            ? point.rotation[0]
                            : Player.getYaw();
                        const pitch = point.rotation && typeof point.rotation[1] === "number"
                            ? point.rotation[1]
                            : Player.getPitch();
                    
                        // Rotate to direction
                        rotationUtils.rotate(yaw, pitch);
                    
                        // Calculate motion vector
                        const radians = (yaw * Math.PI) / 180;
                        const dirX = -Math.sin(radians);
                        const dirZ = Math.cos(radians);
                        const speed = Player.isSneaking()
                            ? Player.getPlayer().field_71075_bZ.func_75094_b() * 0.3
                            : Player.getPlayer().field_71075_bZ.func_75094_b();
                    
                        // Consistent speed multiplier for smoother movement
                        const motionX = dirX * speed * 2.806;
                        const motionZ = dirZ * speed * 2.806;
                    
                        // Apply motion directly
                        playerUtils.setMotion(motionX, Player.getMotionY(), motionZ);
                        continuousMotion = true;
                        motionDirection = { x: dirX, z: dirZ };
                        continuousMx = motionX;
                        continuousMz = motionZ;
                    
                        // Apply motion direction
                        doMotion(yaw);
                    
                        // Update walk state
                        walking = true;
                    
                        if (config().sendMessages) {
                            playerUtils.sendMessage(`&a&lBhopping`);
                        }
                    
                        break;
                    }
                    

                    case "bonzo": {
                        if (Player.asPlayerMP().isOnGround()) playerUtils.setMotion(0, Player.getMotionY(), 0);
                        playerUtils.swap("Bonzo's Staff");
                        rotationUtils.serverRotate(...rotation);

                        Client.scheduleTask(1, () => {
                            rotationUtils.resetServerRotations();
                            playerUtils.rightClick();
                        });
                        break;
                    }
                    case "jump": {
                        if (Player.asPlayerMP().isOnGround()) {
                            playerUtils.jump();
                            jumping = true;
                        }
                        break;
                    }
                    case "hclip": {
                        if (Player.asPlayerMP().isOnGround()) {
                            playerUtils.jump();
                            setTimeout(() => playerUtils.hClip(rotation[0]), 50);
                        } else {
                            playerUtils.hClip(rotation[0]);
                        }
                        break;
                    }
                    case "keybind": {
                        if (point.argz) {
                            let key = point.argz.trim();

                            const quotedMatch = key.match(/^"([^"]+)"/);
                            if (quotedMatch) {
                                key = quotedMatch[1].toLowerCase().trim();
                            } else {
                                key = key.split(' ')[0].toLowerCase().trim();
                            }

                            let keyBind = null;

                            if (key === "tab") {
                                keyBind = Client.getKeyBindFromKey(Keyboard.KEY_TAB);
                                let tabKeybindObj = null;
                                try {
                                    tabKeybindObj = new Keybind("TabPress", Keyboard.KEY_TAB, "byebyegoldor");
                                } catch (e) {}
                                if (keyBind) {
                                    keyBind.setState(true);
                                    Client.scheduleTask(2, () => keyBind.setState(false));
                                }
                                if (tabKeybindObj) {
                                    tabKeybindObj.setState(true);
                                    Client.scheduleTask(2, () => tabKeybindObj.setState(false));
                                }
                                try {
                                    const KeyEvent = Java.type("java.awt.event.KeyEvent");
                                    const Toolkit = Java.type("java.awt.Toolkit");
                                    const robot = new (Java.type("java.awt.Robot"))();
                                    robot.keyPress(KeyEvent.VK_TAB);
                                    robot.keyRelease(KeyEvent.VK_TAB);
                                } catch (e) {}
                                if (config().sendMessages) playerUtils.sendMessage(`&7Pressed keybind: tab`);
                                break;
                            } else {
                                const keyMap = {
                                    "w": Keyboard.KEY_W,
                                    "a": Keyboard.KEY_A,
                                    "s": Keyboard.KEY_S,
                                    "d": Keyboard.KEY_D,
                                    "space": Keyboard.KEY_SPACE,
                                    "shift": Keyboard.KEY_LSHIFT,
                                    "lshift": Keyboard.KEY_LSHIFT,
                                    "rshift": Keyboard.KEY_RSHIFT,
                                    "ctrl": Keyboard.KEY_LCONTROL,
                                    "lctrl": Keyboard.KEY_LCONTROL,
                                    "rctrl": Keyboard.KEY_RCONTROL,
                                    "alt": Keyboard.KEY_LMENU,
                                    "lalt": Keyboard.KEY_LMENU,
                                    "ralt": Keyboard.KEY_RMENU,
                                    "f1": Keyboard.KEY_F1, "f2": Keyboard.KEY_F2, "f3": Keyboard.KEY_F3,
                                    "f4": Keyboard.KEY_F4, "f5": Keyboard.KEY_F5, "f6": Keyboard.KEY_F6,
                                    "f7": Keyboard.KEY_F7, "f8": Keyboard.KEY_F8, "f9": Keyboard.KEY_F9,
                                    "f10": Keyboard.KEY_F10, "f11": Keyboard.KEY_F11, "f12": Keyboard.KEY_F12,
                                    "0": Keyboard.KEY_0, "1": Keyboard.KEY_1, "2": Keyboard.KEY_2,
                                    "3": Keyboard.KEY_3, "4": Keyboard.KEY_4, "5": Keyboard.KEY_5,
                                    "6": Keyboard.KEY_6, "7": Keyboard.KEY_7, "8": Keyboard.KEY_8,
                                    "9": Keyboard.KEY_9,
                                    "b": Keyboard.KEY_B, "c": Keyboard.KEY_C, "e": Keyboard.KEY_E,
                                    "f": Keyboard.KEY_F, "g": Keyboard.KEY_G, "h": Keyboard.KEY_H,
                                    "i": Keyboard.KEY_I, "j": Keyboard.KEY_J, "k": Keyboard.KEY_K,
                                    "l": Keyboard.KEY_L, "m": Keyboard.KEY_M, "n": Keyboard.KEY_N,
                                    "o": Keyboard.KEY_O, "p": Keyboard.KEY_P, "q": Keyboard.KEY_Q,
                                    "r": Keyboard.KEY_R, "t": Keyboard.KEY_T, "u": Keyboard.KEY_U,
                                    "v": Keyboard.KEY_V, "x": Keyboard.KEY_X, "y": Keyboard.KEY_Y,
                                    "z": Keyboard.KEY_Z,
                                    "enter": Keyboard.KEY_RETURN,
                                    "return": Keyboard.KEY_RETURN,
                                    "escape": Keyboard.KEY_ESCAPE,
                                    "esc": Keyboard.KEY_ESCAPE,
                                    "backspace": Keyboard.KEY_BACK,
                                    "delete": Keyboard.KEY_DELETE,
                                    "insert": Keyboard.KEY_INSERT,
                                    "home": Keyboard.KEY_HOME,
                                    "end": Keyboard.KEY_END,
                                    "pageup": Keyboard.KEY_PRIOR,
                                    "pagedown": Keyboard.KEY_NEXT,
                                    "up": Keyboard.KEY_UP,
                                    "down": Keyboard.KEY_DOWN,
                                    "left": Keyboard.KEY_LEFT,
                                    "right": Keyboard.KEY_RIGHT,
                                    "comma": Keyboard.KEY_COMMA,
                                    "period": Keyboard.KEY_PERIOD,
                                    "slash": Keyboard.KEY_SLASH,
                                    "semicolon": Keyboard.KEY_SEMICOLON,
                                    "apostrophe": Keyboard.KEY_APOSTROPHE,
                                    "lbracket": Keyboard.KEY_LBRACKET,
                                    "rbracket": Keyboard.KEY_RBRACKET,
                                    "backslash": Keyboard.KEY_BACKSLASH,
                                    "minus": Keyboard.KEY_MINUS,
                                    "equals": Keyboard.KEY_EQUALS,
                                    "grave": Keyboard.KEY_GRAVE,
                                    "numpad0": Keyboard.KEY_NUMPAD0, "numpad1": Keyboard.KEY_NUMPAD1,
                                    "numpad2": Keyboard.KEY_NUMPAD2, "numpad3": Keyboard.KEY_NUMPAD3,
                                    "numpad4": Keyboard.KEY_NUMPAD4, "numpad5": Keyboard.KEY_NUMPAD5,
                                    "numpad6": Keyboard.KEY_NUMPAD6, "numpad7": Keyboard.KEY_NUMPAD7,
                                    "numpad8": Keyboard.KEY_NUMPAD8, "numpad9": Keyboard.KEY_NUMPAD9,
                                    "numpadadd": Keyboard.KEY_ADD, "numpadsubtract": Keyboard.KEY_SUBTRACT,
                                    "numpadmultiply": Keyboard.KEY_MULTIPLY, "numpaddivide": Keyboard.KEY_DIVIDE,
                                    "numpaddecimal": Keyboard.KEY_DECIMAL, "numpadenter": Keyboard.KEY_NUMPADENTER
                                };
                                if (keyMap[key]) {
                                    keyBind = Client.getKeyBindFromKey(keyMap[key]);
                                }
                            }

                            // If we found a valid keybind, activate it
                            if (keyBind) {
                                keyBind.setState(true);
                                if (config().sendMessages) playerUtils.sendMessage(`&7Activated keybind: ${key}`);
                            } else {
                                if (config().sendMessages) playerUtils.sendMessage(`&cUnknown key: ${key}`);
                            }
                        }
                        break;
                    }
                    case "align": {
                        playerUtils.setPosition(coords[0], Player.getY(), coords[2]);
                        playerUtils.setMotion(0, Player.getMotionY(), 0);
                        break;
                    }
                    case "superboom": {
                        playerUtils.useItem("Infinityboom TNT", rotation, playerUtils.isSneaking, false, playerUtils.leftClick());
                        break;
                    }
                    case "swap": {
                        playerUtils.swap(argz);
                        break;
                    }
                    case "blink": {
                        if (playerUtils.isSneaking) return playerUtils.sendMessage("&7Cannot be sneaking!");
                        if (!packets.length) return playerUtils.sendMessage("&7Invalid blink point!");
                        if (speed != Player.getPlayer().field_71075_bZ.func_75094_b()) return playerUtils.sendMessage(`&7Invalid speed! (Required: ${Math.floor(speed * 1000)})`);
                        if (packets.length > 40) return playerUtils.sendMessage("&7Too many packets! (Limit: 40)");
                        if (waitingTick) return point.near = false;
                        if (flagged) {
                            playerUtils.sendMessage("Teleported back! waiting for next death tick / left click");
                            waitingTick = true;
                            flagged = false;
                            point.near = false;
                            return;
                        }

                        const finalPacket = packets[packets.length - 1];

                        packets.forEach(packet => {
                            Client.sendPacket(new C06PacketPlayerPosLook(...packet));
                            global.balancePackets -= 1;
                            if (packet == finalPacket) {
                                const prevPitch = Player.getPitch();
                                rotationUtils.rotate(Player.getYaw(), 90);
                                setTimeout(() => rotationUtils.rotate(Player.getYaw(), prevPitch), 5);
                            }
                        });

                        playerUtils.setPosition(finalPacket[0], finalPacket[1], finalPacket[2]);
                        playerUtils.setMotion(0, point.motion[1], 0);
                        playerUtils.sendMessage(`&fUsed blink (${packets.length} packets)`);

                        lastBlink = Date.now();

                        waitingFlag = true;
                        Client.scheduleTask(1, () => waitingFlag = false);
                        break;
                    }
                    case "lavaclip": {
                        lavaClip(true);
                        break;
                    }
                    case "stopwatch": {
                        // Stopwatch ring: start/stop timing with precise millisecond accuracy
                        const action = point.argz ? point.argz.toLowerCase().trim() : "start";

                        if (action === "start") {
                            stopwatchStartTime = Date.now();
                            stopwatchRunning = true;
                            ChatLib.chat(`&a&l[STOPWATCH] &f&lSTARTED`);
                            if (config().sendMessages) playerUtils.sendMessage(`&aStopwatch started`);
                        } else if (action === "stop") {
                            if (!stopwatchRunning || stopwatchStartTime === null) {
                                ChatLib.chat(`&c&l[STOPWATCH] &7No active stopwatch to stop!`);
                                return;
                            }

                            const endTime = Date.now();
                            const elapsedMs = endTime - stopwatchStartTime;
                            const elapsedSeconds = (elapsedMs / 1000).toFixed(3);

                            const minutes = Math.floor(elapsedMs / 60000);
                            const seconds = Math.floor((elapsedMs % 60000) / 1000);
                            const milliseconds = elapsedMs % 1000;

                            let timeDisplay;
                            if (minutes > 0) {
                                timeDisplay = `${minutes}m ${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
                            } else {
                                timeDisplay = `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
                            }

                            ChatLib.chat(`&c&l[STOPWATCH] &f&lSTOPPED`);
                            ChatLib.chat(`&e&l[TIME] &f&l${timeDisplay} &7(${elapsedSeconds}s)`);

                            stopwatchRunning = false;
                            stopwatchStartTime = null;

                            if (config().sendMessages) playerUtils.sendMessage(`&cStopwatch stopped: ${timeDisplay}`);
                        }
                        break;
                    }
                    case "motion": {
                        const argsList = point.argz ? point.argz.split(" ") : [];
                        playerUtils.stopMovement();
                        walking = false;
                        if (argsList.includes("align")) {
                            playerUtils.setPosition(coords[0], Player.getY(), coords[2]);
                            playerUtils.sendDebugMessage("align");
                        }
                        let jumpDist = 1;
                        let hasJump = argsList.includes("jump");
                        let hasWalk = argsList.includes("walk");
                        for (const arg of argsList) {
                            if (arg.startsWith("dist=")) {
                                let val = parseFloat(arg.slice(5));
                                if (!isNaN(val)) {
                                    jumpDist = Math.max(0.01, Math.min(val, 1));
                                }
                            }
                        }
                        motionJumpDist = jumpDist;
                        if (hasWalk && !hasJump) {
                            playerUtils.sendDebugMessage("walk");
                        }
                        if (hasJump) {
                            playerUtils.sendDebugMessage(`jump (dist=${jumpDist})`);
                            if (Player.asPlayerMP().isOnGround()) {
                                playerUtils.jump();
                                jumping = true;
                            }
                            const yaw = rotation[0];
                            const radians = (yaw * Math.PI) / 180;
                            const speed = Player.getPlayer().field_71075_bZ.func_75094_b();
                            const speedMult = 2.806 * jumpDist;
                            const motionx = -Math.sin(radians) * speed * speedMult;
                            const motionz = Math.cos(radians) * speed * speedMult;
                            playerUtils.setMotion(motionx, Player.getMotionY(), motionz);
                            continuousMotion = true;
                            motionDirection = yaw;
                            continuousMx = motionx;
                            continuousMz = motionz;
                        } else if (hasWalk) {
                            const yaw = rotation[0];
                            const radians = (yaw * Math.PI) / 180;
                            const speed = Player.isSneaking() ? Player.getPlayer().field_71075_bZ.func_75094_b() * 0.3 : Player.getPlayer().field_71075_bZ.func_75094_b();
                            const motionx = -Math.sin(radians) * speed * 2.806;
                            const motionz = Math.cos(radians) * speed * 2.806;
                            playerUtils.setMotion(motionx, Player.getMotionY(), motionz);
                            continuousMotion = true;
                            motionDirection = yaw;
                            continuousMx = motionx;
                            continuousMz = motionz;
                        }
                        doMotion(point.rotation[0]);
                        if (argsList.includes("rotate")) {
                            rotationUtils.rotate(rotation[0], rotation[1]);
                            playerUtils.sendDebugMessage("rotate");
                        }
                        break;
                    }
                    case "command": {
                        if (!argz) {
                            playerUtils.sendMessage("&7No command specified!");
                            break;
                        }

                        try {
                            playerUtils.sendMessage(`&7Running command: ${argz}`);
                            ChatLib.command(argz, true);
                        } catch (err) {
                            playerUtils.sendMessage(`&cError running command: ${err}`);
                        }
                        break;
                    }
                    case "walk": {
                        rotationUtils.rotate(...rotation);
                        forwardKey.setState(true);
                        walking = true;
                        const yaw = rotation[0];
                        const radians = (yaw * Math.PI) / 180;
                        const dirX = -Math.sin(radians);
                        const dirZ = Math.cos(radians);
                        const speed = Player.isSneaking() ? Player.getPlayer().field_71075_bZ.func_75094_b() * 0.3 : Player.getPlayer().field_71075_bZ.func_75094_b();

                        const motionX = dirX * speed * 2.806;
                        const motionZ = dirZ * speed * 2.806;
                        playerUtils.setMotion(motionX, Player.getMotionY(), motionZ);

                        continuousMotion = true;
                        motionDirection = { x: dirX, z: dirZ };
                        continuousMx = motionX;
                        continuousMz = motionZ;

                        if (config().sendMessages) playerUtils.sendMessage(`&7Started walking in direction ${yaw.toFixed(2)}`);
                        break;
                    }
                }
            } else if (!isLogging()) point.near = false;
        });
    });
});

register("tick", () => {
    if (Player == null || motionDirection == null || continuousMotion == false) return;
    if (Player.asPlayerMP().isOnGround()) airTicks = 0; else airTicks++;
    if (isPlayerInLiquid()) return;
    if (forwardKey.isKeyDown()) {
        continuousMotion = false;
        motionDirection = null;
        continuousMx = 0;
        continuousMz = 0;
    }
    let speed = Player.getPlayer().field_71075_bZ.func_75094_b();
    if (Player.asPlayerMP().isSprinting()) speed /= sprintMult;
    let speedMult = continuousMotion && motionJumpDist ? 2.806 * motionJumpDist : 2.806;
    if (airTicks < 1) {
        const rad = (motionDirection * Math.PI) / 180;
        if (jumping) {
            jumping = false;
            speedMult += 2;
            speedMult *= 1.25;
        }
        const motionx = -Math.sin(rad) * speed * speedMult;
        const motionz = Math.cos(rad) * speed * speedMult;
        playerUtils.setMotion(motionx, Player.getMotionY(), motionz);
        return;
    }

    let movementval = (Player.asPlayerMP().isOnGround() || (airTicks == 1 && Player.getMotionY() < 0)) ? speed * sprintMult * (continuousMotion && motionJumpDist ? motionJumpDist : 1) : 0.02 * sprintMult;
    const rad = (motionDirection * Math.PI) / 180;
    const motionx = -Math.sin(rad) * movementval;
    const motionz = Math.cos(rad) * movementval;
    playerUtils.setMotion(Player.getMotionX() + motionx, Player.getMotionY(), Player.getMotionZ() + motionz);
});

function doMotion(yaw) {
    continuousMotion = true;
    motionDirection = yaw;
}

function isPlayerInLiquid() {
    const [x, y, z] = [Player.getX(), Player.getY(), Player.getZ()];
    const blockPos = new BlockPos(x, y, z);
    const block = World.getBlockAt(blockPos);

    const blockType = block.type.getID();

    return blockType == 9 || blockType == 10 || blockType == 8 || blockType == 11;
}

register(MouseEvent, (event) => {
    if (event.button == 0 && event.buttonstate) {
        Object.entries(data.points).forEach(([config, points]) => {
            points.forEach(point => {
                point.near = false;
                if (point.awaitingClick) {
                    delete point.awaitingClick;
                }
            });
        });
        waitingFlag = false;
        flagged = false;
        waitingTick = false;
        
        finishedI1 = true;
        openedTerm = true;
        everyoneLeaped = true;

        Client.scheduleTask(0, () => {
            finishedI1 = false;
            openedTerm = false;
            everyoneLeaped = false;
        });
    }
});

register("worldLoad", () => {
    startedGoldor = false;
    if (walking) {
        forwardKey.setState(false);
        walking = false;
    }
    if (continuousMotion) {
        continuousMotion = false;
        motionDirection = null;
        continuousMx = 0;
        continuousMz = 0;
    }
});

S02Event.addListener((packet, event, mcEvent) => {
    if (event.unformatted === "[Phoenix] Ending i1!") {
        finishedI1 = true;
        Client.scheduleTask(0, () => finishedI1 = false);
    }
});

S2DEvent.addListener((packet, event, mcEvent) => {
    if (event.isTerminal) {
        openedTerm = true;
        Client.scheduleTask(0, () => openedTerm = false);
    }
});

EveryoneLeapedEvent.addListener(() => {
    everyoneLeaped = true;
    Client.scheduleTask(0, () => everyoneLeaped = false);
});

S08Event.addListener((packet, event, mcEvent) => {
    if (waitingFlag) {
        waitingFlag = false;
        flagged = true;
        Client.scheduleTask(5, () => flagged = false);
    }
});

DeathTickEvent.addListener(() => Client.scheduleTask(1, () => waitingTick = false));

new Keybind("Toggle", Keyboard.KEY_NONE, "voidaddons").registerKeyPress(() => {
    config().autoP3 = !config().autoP3;
    if (!config().autoP3 && walking) {
        forwardKey.setState(false);
        walking = false;
    }
    if (!config().autoP3 && continuousMotion) {
        continuousMotion = false;
        motionDirection = null;
        continuousMx = 0;
        continuousMz = 0;
    }
    playerUtils.sendMessage(config().autoP3 ? "&aEnabled" : "&cDisabled");
});