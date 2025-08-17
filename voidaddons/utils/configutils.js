import PogObject from "../../PogData";

import config from "../config";
import playerUtils from "./playerUtils";
import rotationUtils from "./rotationUtils";
import { C03PacketPlayer, Color } from "./mappings";
import { Keybind } from "../../KeybindFix";
import dungeonUtils from "./dungeonUtils";

export const data = new PogObject("voidaddons", {
    config: null,
    points: {}
}, "data/data.json");

const types = [
    "rotate",
    "stop",
    "bonzo",
    "jump",
    "superboom",
    "align",
    "hclip",
    "swap",
    "text",
    "lavaclip",
    "motion",
    "walk",
    "keybind",
	"command",
    "bhop",
	"stopwatch",
    "edge"
];

function addPoint(type, args) {
    if (!data.config || !type || !types.includes(type.toLowerCase())) return;

    if (!data.points[data.config]) {
        data.points[data.config] = [];
    }

	let argz = args ? args.join(" ") : "";

	while (argz.length > 0 && argz.charAt(0) === ' ') argz = argz.substring(1);
	while (argz.length > 0 && argz.charAt(argz.length - 1) === ' ') argz = argz.substring(0, argz.length - 1);


    const renderManager = Client.getMinecraft().func_175598_ae();

    type = type.toLowerCase();
    let radius = 0.5;
    if (args && !isNaN(args[args.length - 1]) && type !== "text") radius = parseFloat(args[args.length - 1]);

    let room = dungeonUtils.getRoomName();
    let rotation = [dungeonUtils.inDungeon() && !dungeonUtils.inBoss() ? dungeonUtils.getRoomYaw(Player.getYaw()) : Player.getYaw(), Player.getPitch()];
    let playerCoords = [renderManager.field_78730_l, renderManager.field_78731_m - 1, renderManager.field_78728_n];
    let coords = dungeonUtils.inDungeon() && !dungeonUtils.inBoss() ? dungeonUtils.getRoomCoords(...playerCoords) : playerCoords;
    let raytrace = dungeonUtils.inDungeon() && !dungeonUtils.inBoss() ? dungeonUtils.getRoomCoords(...rotationUtils.rayTrace()) : rotationUtils.rayTrace();

    data.points[data.config].push({
        room,
        coords,
        rotation,
        type,
        argz,
        raytrace,
        radius,
        near:true,
        packets:[],
        speed:playerUtils.getWalkCapabilities()
    });

    data.save();

    playerUtils.sendMessage(`&fAdded ${type} in ${room}`);
}

register("command", (action, arg2, ...args) => {
    if (!action) return config().getConfig().openGui();
    const nearest = getNearest();

    switch (action) {
        case "add": {
            addPoint(arg2, args);
            break;
        }
        case "config": {
            if (!data.config) return playerUtils.sendMessage("&fNo Config Selected");
            return playerUtils.sendMessage(`&fCurrent Config: ${data.config}`);
        }

        case "load": {
            if (!arg2 || !data.points[arg2]) return playerUtils.sendMessage("&cConfig not found.");
            data.config = arg2;
            data.save();
            playerUtils.sendMessage(`&fLoaded ${arg2}`);
            break;
        }

        case "new": {
            if (!arg2) return playerUtils.sendMessage("&cPlease specify a config name.");
            if (data.points[arg2]) return playerUtils.sendMessage("&cThat config already exists.");
            data.points[arg2] = [];
            data.config = arg2;
            data.save();
            playerUtils.sendMessage(`&fCreated new config: ${arg2}`);
            break;
        }

        case "delete": {
            if (!arg2 || !data.points[arg2]) return playerUtils.sendMessage("&cConfig not found.");
            delete data.points[arg2];
            if (data.config === arg2) data.config = null;
            data.save();
            playerUtils.sendMessage(`&fDeleted config: ${arg2}`);
            break;
        }

        case "list": {
            playerUtils.sendMessage("&9&lConfigs:")
            const entries = Object.entries(data.points);
            if (entries.length === 0) return playerUtils.sendMessage("&cNo configs found.");
            entries.forEach(([config, points]) =>
                playerUtils.sendMessage(`&f${config} &f(${points.length} ${points.length === 1 ? "point" : "points"})`)
            );
            break;
        }
        case "remove": {
            if (!data.config) return;

            let nearestPoint;
            if (!arg2) nearestPoint = nearest;
            else nearestPoint = getNearestPoint(arg2);
            if (!nearestPoint) return;

            const { config, index, point } = nearestPoint;
            data.points[config].splice(index, 1);
            data.save();

            playerUtils.sendMessage(`&fRemoved ${point.type}`);
            break;
        }
        case "radius": {
            if (!data.config || !nearest) return;

            const { config, index } = nearest;
            data.points[config][index].radius = parseFloat(arg2);
            data.save();
            break;
        }
        case "help": {
            const messages = [
                "&f/void config",
                "&f/void load <config>",
                "&f/void new <config>",
                "&f/void delete <config>",
                `&f/void add <rotate, stop, motion, walk, bonzo, jump, edge, superboom, align, hclip, swap, text, lavaclip, keybind, command, bhop, stopwatch>`,
                "&f/void radius <radius>",
                "&f/void remove"
            ];

            messages.forEach(msg => playerUtils.sendMessage(msg));
            break;
        }
    }
}).setName("voidaddons").setAliases("void")

export const getNearest = () => {
    let nearestDistance = Infinity;
    let nearestPoint = null;

    if (!data.points[data.config]) return nearestPoint;

    data.points[data.config].forEach((point, index) => {
        if (point.room != dungeonUtils.getRoomName() && Server.getIP() != "localhost") return;

        let coords = point.coords;
        if (dungeonUtils.isDungeonPoint(point.room)) coords = dungeonUtils.getRealCoords(...coords);
        const distance = playerUtils.getRenderDistance(...coords);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestPoint = { config:data.config, index, point };
        }
    });
    
    return nearestPoint;
}

function getNearestPoint(type) {
    let nearestDistance = Infinity;
    let nearestPoint = null;

    if (!data.points[data.config]) return nearestPoint;

    data.points[data.config].forEach((point, index) => {
        if (point.room != dungeonUtils.getRoomName() && Server.getIP() != "localhost" ) return;

        let coords = point.coords;
        if (dungeonUtils.isDungeonPoint(point.room)) coords = dungeonUtils.getRealCoords(...coords);
        const distance = playerUtils.getRenderDistance(...coords);

        if (distance < nearestDistance && point.type == type) {
            nearestDistance = distance;
            nearestPoint = { config:data.config, index, point };
        }
    });
    
    return nearestPoint;
}

let logging = false;

export const isLogging = () => {
    return logging;
}

function packetLog(point) {
    logging = true;
    packetLogger.register();
}

const packetLogger = register("packetSent", (packet) => {
    if (global.inFreeCam || !packet.func_149466_j()) return;

    const coords = [packet.func_149464_c(), packet.func_149467_d(), packet.func_149472_e()];
    if (coords.every(coord => coord == 0)) return;

    data.save();
}).setFilteredClass(C03PacketPlayer).unregister();
