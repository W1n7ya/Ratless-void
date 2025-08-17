import Settings from "../Amaterasu/core/Settings"
import DefaultConfig from "../Amaterasu/core/DefaultConfig"

const scheme = "data/ColorScheme.json"
const config = new DefaultConfig("voidaddons", "data/settings.json")
  .addSwitch({
    category: "AutoP3",
    configName: "autoP3",
    title: "Auto P3",
    description: "Enable/Disable AutoP3"
  })
  .addSwitch({
    category: "Extra",
    configName: "instaMid",
    title: "Insta Mid",
    description: "Keeps u at mid during necron"
  })
  .addDropDown({
    configName: "renderType",
    title: "Render Type",
    description: "Select the shape to render instead of a square",
    category: "AutoP3",
    subcategory: "Rendering",
    options: ["Square", "Circle", "Box", "Layers"],
    value: 0, // Default to "Square"
    shouldShow: data => data.autoP3
})
.addSlider({
    category: "AutoP3",
    configName: "circlePoints",
    title: "Circle Segments",
    subcategory: "Rendering",
    description: "Number of segments for circular rendering (3-20). Higher values make circles smoother but may impact performance.",
    options: [3, 20],
    value: 20,
    shouldShow: data => data.autoP3 && data.renderType === 1
})
  .addSwitch({
    category: "AutoP3",
    configName: "usePresets",
    title: "Use Presets for Layers or circles",
    subcategory: "Rendering",
    description: "Toggles preset color schemes for Layers or circle rendering",
    shouldShow: data => data.autoP3 && (data.renderType === 3 || data.renderType === 1)
  })

  .addSwitch({
    category: "AutoP3",
    configName: "disableRender",
    title: "NoRender Rings",
    subcategory: "Rendering",
    description: "Doesnt Render Rings",
    shouldShow: data => data.autoP3
  })
	.addDropDown({
	    category: "AutoP3",
	    configName: "renderPreset",
	    title: "Preset Theme",
	    subcategory: "Rendering",
	    description: "Select the color preset for Stacked Square rendering",
	    options: ["Trans", "Lesbian", "Gay", "Custom"],
	    value: 0,
	    shouldShow: data => data.autoP3 && data.renderType === 3 && data.usePresets
	})

	// ✅ Add 5 color pickers (shown only if "Custom" is selected)
	.addColorPicker({
	    category: "AutoP3",
	    configName: "customColor1",
	    title: "Custom Color 1 (Top)",
	    value: [255, 0, 0, 255],
	    shouldShow: data => data.autoP3 && data.renderType === 3 && data.usePresets && data.renderPreset === 3
	})
	.addColorPicker({
	    category: "AutoP3",
	    configName: "customColor2",
	    title: "Custom Color 2",
	    value: [255, 165, 0, 255],
	    shouldShow: data => data.autoP3 && data.renderType === 3 && data.usePresets && data.renderPreset === 3
	})
	.addColorPicker({
	    category: "AutoP3",
	    configName: "customColor3",
	    title: "Custom Color 3 (Middle)",
	    value: [255, 255, 0, 255],
	    shouldShow: data => data.autoP3 && data.renderType === 3 && data.usePresets && data.renderPreset === 3
	})
	.addColorPicker({
	    category: "AutoP3",
	    configName: "customColor4",
	    title: "Custom Color 4",
	    value: [0, 128, 255, 255],
	    shouldShow: data => data.autoP3 && data.renderType === 3 && data.usePresets && data.renderPreset === 3
	})
	.addColorPicker({
	    category: "AutoP3",
	    configName: "customColor5",
	    title: "Custom Color 5 (Bottom)",
	    value: [128, 0, 128, 255],
	    shouldShow: data => data.autoP3 && data.renderType === 3 && data.usePresets && data.renderPreset === 3
	})

  .addColorPicker({
    category: "AutoP3",
    configName: "renderColor",
    title: "Rendering Color",
    subcategory: "Rendering",
    description: "Changes the rendering color",
    value: [255, 255, 255],
    shouldShow: data => data.autoP3
  })
  .addSwitch({
	category: "AutoP3",
	configName: "animateRender",
    subcategory: "Rendering",
    title: "Animate Squares",
	description: "Toggle animation for square type points",
	shouldShow: data => data.autoP3,
	onToggle: (enabled) => {
      playerUtils.sendMessage(enabled ? "&aAnimate Render Enabled" : "&cAnimate Render Disabled");
    }
  })
  .addSwitch({
    category: "AutoP3",
    configName: "typeRendering",
    title: "Type Rendering",
    subcategory: "Rendering",
    description: "Renders the type of point above the ring",
    shouldShow: data => data.autoP3
  })

  .addSwitch({
    category: "AutoP3",
    configName: "phase",
    title: "Phase",
    subcategory: "Rendering",
    description: "Allows you to see the points through walls",
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "AutoP3",
    configName: "sendMessages",
    title: "Send Messages",
    description: "Sends a message of the action you just used",
    subcategory: "Other",
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "AutoP3",
    configName: "disableAfterGoldor",
    title: "Disable after Goldor",
    description: "Disables all rings after the core has been opened (useful for DPS)",
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "AutoP3",
    configName: "debugMessages",
    title: "Send Debug Messages",
    description: "Sends debug messages",
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "Blink",
    configName: "timerBalance",
    title: "Timer Balance",
    description: "Balances timer checks by cancelling unused player packets"
  })
  .addSwitch({
    category: "Blink",
    configName: "displayPackets",
    title: "Display Packets",
    description: "Displays how many balanced packets you have",
    shouldShow: data => data.timerBalance
  })
  .addSlider({
    category: "Blink",
    configName: "removeAmount",
    title: "Remove Amount",
    description: "Removes an amount of packets from the balanced amount (Default: 50)",
    options: [0, 100],
    value: 50,
    shouldShow: data => data.timerBalance
  })
  .addSlider({
    category: "Blink",
    configName: "removeInterval",
    title: "Remove Interval",
    description: "How many seconds between removing packets from the balanced amount (Default: 10)",
    options: [1, 20],
    value: 10,
    shouldShow: data => data.timerBalance
  })
  .addSwitch({
    category: "Blink",
    configName: "balanceBoss",
    title: "Only balance in boss",
    description: "Only balances packets in boss",
    shouldShow: data => data.timerBalance
  })
  .addSwitch({
    category: "Blink",
    configName: "renderBlink",
    title: "Render Blink Line",
    description: "Renders the path of the blink packets"
  })
  .addSlider({
    category: "Extra",
    configName: "hClipBoost",
    title: "HClip Boost",
    description: "Adds more speed to HClip (Default: 12)",
    options: [0, 15],
    value: 12
  })

  .addSwitch({
    category: "Extra",
    configName: "invWalk",
    title: "Invwalk",
    description: "Inventory walk for some random inventories"
  })
  .addSlider({
    category: "Extra",
    configName: "lavaClipBlocks",
    title: "Lava Clip Blocks",
    description: "How many blocks to clip down when you lavaclip",
    options: [10, 100],
    value: 40
  })
  .addSwitch({
    category: "Extra",
    configName: "bossClip",
    title: "Boss Clip",
    description: "Clips you down to storm when you enter boss"
  })
  .addSwitch({
    category: "Extra",
    configName: "witherESP",
    title: "Wither ESP",
    description: "Outlines the bosses in F7/M7"
  })
  .addColorPicker({
    category: "Extra",
    configName: "witherESPColor",
    title: "Wither ESP Color",
    description: "Changes the color for Wither ESP",
    value: [255, 255, 255],
    shouldShow: data => data.witherESP
  })
  .addSwitch({
    category: "Extra",
    configName: "leapNotifier",
    title: "Leap Notifier",
    description: "Notifies you when noone is in the previous section"
  })
	.addSwitch({
		category: "Extra",
		configName: "LeapMessage",
		title: "Leap Message",
		description: "Announces Leaps",
		subcategory: "Extra"
	})
  .addSwitch({
    category: "Extra",
    configName: "vertJerry",
    title: "Vertical Jerry",
    description: "Cancels horizontal knockback from a jerry-chine gun"
  })
  .addSwitch({
    category: "Extra",
    configName: "zeroPingEtherwarp",
    title: "Zero Ping Etherwarp",
    description: "Makes using etherwarp instantly teleport you"
  })
  .addSwitch({
    category: "Extra",
    configName: "keepMotion",
    title: "Etherwarp Keep Motion",
    description: "Keeps your motion when you etherwarp",
    shouldShow: data => data.zeroPingEtherwarp
  })
  .addSwitch({
    category: "Auto Leap",
    configName: "autoLeap",
    title: "Auto Leap",
    description: "Automatically leaps to the next early enter when you left click your leap"
  })
  .addTextInput({
    category: "Auto Leap",
    configName: "ee2Leap",
    title: "Early Enter 2 Leap",
    description: "",
    shouldShow: data => data.autoLeap
  })
  .addTextInput({
    category: "Auto Leap",
    configName: "ee3Leap",
    title: "Early Enter 3 Leap",
    description: "",
    shouldShow: data => data.autoLeap
  })
  .addTextInput({
    category: "Auto Leap",
    configName: "coreLeap",
    title: "Core Leap",
    description: "",
    shouldShow: data => data.autoLeap
  })
  .addTextInput({
    category: "Auto Leap",
    configName: "inCoreLeap",
    title: "Inside Core Leap",
    description: "",
    shouldShow: data => data.autoLeap
  })
  .addSwitch({
    category: "Insta 1",
    configName: "insta1",
    title: "Insta 1",
    description: "Automatically completes simon says device quickly"
  })
  /*.addDropDown({
    category: "Insta 1",
    configName: "insta1Role",
    title: "Insta 1 Role",
    description: "The role to use for i1",
    options: ["1", "2", "3"],
    shouldShow: data => data.insta1
  })*/
  .addSlider({
    category: "Insta 1",
    configName: "insta1Delay",
    title: "Insta 1 Delay",
    description: "",
    options: [0, 100],
    value: 0,
    shouldShow: data => data.insta1
  })
  .addSlider({
    category: "Insta 1",
    configName: "insta1Clicks",
    title: "Insta 1 Clicks",
    description: "",
    options: [0, 15],
    value: 0,
    shouldShow: data => data.insta1
  })
  .addSlider({
    category: "Insta 1",
    configName: "insta1Ping",
    title: "Insta 1 Ping",
    description: "The ping to delay the clicks at (0 = dynamic pinging)",
    options: [0, 250],
    value: 0,
    shouldShow: data => data.insta1
  })
  const setting = new Settings("voidaddons", config, scheme)
    .setPos(25, 25)
    .setSize(50, 50)
    .apply()
export default () => setting.settings;