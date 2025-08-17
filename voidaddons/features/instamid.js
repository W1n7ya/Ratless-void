import config from "./config";

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook");
const C0CPacketInput = Java.type("net.minecraft.network.play.client.C0CPacketInput");
const S1BPacketEntityAttach = Java.type("net.minecraft.network.play.server.S1BPacketEntityAttach");

let preparing = true;

register("packetSent", (packet, event) => {
    if (!config().instaMid) return;

    cancel(event);
    const riding = Player.getPlayer().func_70115_ae();
    if (riding) preparing = false;
    if (!riding && !preparing) {
        preparing = true;
        Client.sendPacket(new C06PacketPlayerPosLook(54, 65, 76, 0, 0, false));
    }
}).setFilteredClasses([C03PacketPlayer, C0CPacketInput]);

register("packetReceived", packet => {
    if (!config().instaMid) return;
    if (!isOnPlatform()) return;
    if (packet.func_149403_d() !== Player.getPlayer().func_145782_y()) return;
    if (packet.func_149402_e() < 0) return;

    preparing = true;
    ChatLib.chat("§1[§fVoid§1]§f instamidding…");
}).setFilteredClass(S1BPacketEntityAttach);

function isOnPlatform() {
    if (Player.getY() > 100) return false;
    if (Player.getY() < 64) return false;
    return Math.abs(Player.getX() - 54.5) ** 2 + Math.abs(Player.getZ() - 76.5) ** 2 < 56.25;
}