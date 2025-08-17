global.balancePackets = 0;
global.inFreeCam = false;
global.hasMana = true;

import "./config";

// managers

import "./utils/configutils";
import "./utils/pointutils";
import "./utils/renderutils";

// modules

import "./features/hClip";
import "./features/invWalk";
import "./features/lavaClip";
import "./features/pearlClip";
import "./features/freeCam";
import "./features/bossClip";
import "./features/timerBalance";
import "./features/autoLeap";
import "./features/leapNotifier";
import "./features/verticalJerry";
import "./features/zpew";
import "./features/insta1";

// utils

import "./utils/playerUtils";
import "./utils/rotationUtils";
import "./utils/timerUtils";
import "./utils/leapUtils";
import "./utils/dungeonUtils";
import S08Event from "./events/packets/server/S08Event";

register("command", () => ChatLib.command("warp dh", false)).setName("dh");
register("chat", () => ChatLib.command("l", false)).setCriteria("A kick occurred in your connection, so you were put in the SkyBlock lobby!");
register("chat", (event) => cancel(event)).setCriteria("Your Implosion").setContains();
register("chat", (event) => cancel(event)).setCriteria("There are blocks in the way!");

S08Event.addListener((packet, event, mcEvent) => {
    if (Server.getIP() == "localhost") cancel(mcEvent);
})