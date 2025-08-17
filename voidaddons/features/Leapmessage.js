 import config from "../config";


register("chat", (player, event) => {
    if (!config().LeapMessage) return;
    
    ChatLib.command("pc [Void] Leaped to " + player)
   
  }).setCriteria(/^You have teleported to (\w+)!$/)