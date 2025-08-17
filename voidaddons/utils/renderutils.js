import { drawLine3d } from "../../BloomCore/utils/Utils";
import RenderLibV2 from "../../RenderLibV2";
import config from "../config";
import dungeonUtils from "./dungeonUtils";
import { Color } from "./mappings";
import { data } from "./configutils";

register("renderWorld", () => {
    if (!config().autoP3 || config().disableRender) return;

    const presets = {
        trans: [
            [0.36, 0.73, 0.93, 1],
            [1, 0.69, 0.79, 1],
            [1, 1, 1, 1],
            [1, 0.69, 0.79, 1],
            [0.36, 0.73, 0.93, 1]
        ],
        lesbian: [
            [1, 0.27, 0, 1],
            [1, 0.55, 0.28, 1],
            [1, 1, 1, 1],
            [1, 0.63, 0.82, 1],
            [0.78, 0.22, 0.49, 1]
        ],
        gay: [
            [1, 0, 0, 1],
            [1, 0.5, 0, 1],
            [1, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 0, 1, 1]
        ]
    };

    // Type-specific colors for points when renderType === 1 and usePresets is enabled
    const typeColors = {
        rotate: [0, 0, 1, 1],        // Blue
        stop: [0, 0, 1, 1],          // Blue
        align: [0, 0, 1, 1],         // Blue
        jump: [0, 0, 0.5, 1],        // Dark Blue
        edge: [0, 1, 1, 1],          // Cyan
        lavaclip: [0.65, 0.33, 0.15, 1], // Brown
        keybind: [0.65, 0.33, 0.15, 1],  // Brown
        hclip: [0.65, 0.33, 0.15, 1],    // Brown
        motion: [0, 0.5, 0, 1],      // Dark Green
        walk: [0, 0.5, 0, 1],        // Dark Green
        bhop: [0.5, 1, 0, 1],        // Lime
        command: [1, 1, 0, 1]        // Yellow
    };

    // Safe render color (fallback white)
    const renderColor = Array.isArray(config().renderColor) ? config().renderColor : [255, 255, 255, 255];
    const defaultColor = [
        (renderColor[0] ?? 255) / 255,
        (renderColor[1] ?? 255) / 255,
        (renderColor[2] ?? 255) / 255,
        (renderColor[3] ?? 255) / 255,
    ];

    const animate = config().animateRender;
    const time = Date.now() / 1000;
    const baseNormalHeight = 1.05;
    const animationAmplitude = 0.05;
    const animationSpeed = 4;
    const heightOffset = animate ? animationAmplitude * Math.sin(time * animationSpeed) : 0;

    Object.entries(data.points).forEach(([cfg, points]) => {
        if (cfg != data.config) return;

        const groupedByCoords = {};

        points.forEach(point => {
            let { room, coords, radius, type, packets } = point;

            if (room != dungeonUtils.getRoomName() && Server.getIP() != "localhost") return;
            if (dungeonUtils.isDungeonPoint(room)) coords = dungeonUtils.getRealCoords(...coords);

            const key = `${coords[0].toFixed(2)},${coords[1].toFixed(2)},${coords[2].toFixed(2)}`;
            if (!groupedByCoords[key]) groupedByCoords[key] = [];
            groupedByCoords[key].push(point);
        });

        Object.values(groupedByCoords).forEach(pointsAtCoords => {
            pointsAtCoords.forEach(point => {
                let { coords, radius, type, packets } = point;
                const renderType = config().renderType;

                const segments = config().circlePoints; // 3-20 slider

                if (renderType === 2) {
                    const size = radius * 2;
                    const height = 0.7;
                    RenderLibV2.drawEspBoxV2(
                        coords[0], coords[1] + 1.01, coords[2],
                        size, height, size,
                        ...defaultColor, config().phase, 1.5
                    );
                } else if (renderType === 1) {
                    let circleColor = defaultColor;
                    if (config().usePresets) {
                        // Check if all points at this coordinate have the same type
                        const allSameType = pointsAtCoords.every(p => p.type === pointsAtCoords[0].type);
                        if (allSameType && typeColors[pointsAtCoords[0].type]) {
                            // Use type-specific color if all points have the same type
                            circleColor = typeColors[pointsAtCoords[0].type];
                        } else {
                            // Mix colors for different types at the same coordinates
                            let r = 0, g = 0, b = 0, a = 0;
                            let count = pointsAtCoords.length;
                            pointsAtCoords.forEach(p => {
                                const color = typeColors[p.type] || defaultColor;
                                r += color[0];
                                g += color[1];
                                b += color[2];
                                a += color[3];
                            });
                            circleColor = [
                                r / count,
                                g / count,
                                b / count,
                                a / count
                            ];
                        }
                    }
                    RenderLibV2.drawCyl(
                        coords[0], coords[1] + 1.01, coords[2],
                        radius, radius, 0.01,
                        segments, 1, 90, 0, 0,
                        ...circleColor, config().phase, true
                    );
                } else if (renderType === 3) {
                    if (config().usePresets) {
                        const presetKey = ["trans", "lesbian", "gay", "custom"][config().renderPreset] || "trans";

                        let colors;
                        if (presetKey === "custom") {
                            colors = [
                                config().customColor1.map(c => c / 255),
                                config().customColor2.map(c => c / 255),
                                config().customColor3.map(c => c / 255),
                                config().customColor4.map(c => c / 255),
                                config().customColor5.map(c => c / 255)
                            ];
                        } else {
                            colors = presets[presetKey] ?? presets.trans;
                        }

                        for (let i = 0; i < 5; i++) {
                            const c = Array.isArray(colors[i]) ? colors[i] : [1, 1, 1, 1];
                            RenderLibV2.drawEspBoxV2(
                                coords[0], coords[1] + 1.01 + i * 0.2, coords[2],
                                radius * 1.5, 0.01, radius * 1.5,
                                ...c, config().phase, 1.5
                            );
                        }
                    } else {
                        for (let i = 0; i < 5; i++) {
                            RenderLibV2.drawEspBoxV2(
                                coords[0], coords[1] + 1.01 + i * 0.2, coords[2],
                                radius * 1.5, 0.01, radius * 1.5,
                                ...defaultColor, config().phase, 1.5
                            );
                        }
                    }
                } else {
                    RenderLibV2.drawEspBoxV2(
                        coords[0], coords[1] + baseNormalHeight + heightOffset, coords[2],
                        radius * 1.5, 0.1, radius * 1.5,
                        ...defaultColor, config().phase, 1.5
                    );
                }

                if (config().typeRendering) {
                    const types = pointsAtCoords.map(p => p.type).join(", ");
                    Tessellator.drawString(
                        types,
                        coords[0], coords[1] + 1.2, coords[2],
                        Color.WHITE.getRGB(),
                        true, 0.02, false
                    );
                }

                if (type === "blink" && config().renderBlink && Array.isArray(packets)) {
                    for (let i = 0; i < packets.length; i++) {
                        let packet1 = packets[i];
                        let packet2 = packets[i + 1];
                        if (!Array.isArray(packet1) || !Array.isArray(packet2)) continue;
                        drawLine3d(
                            packet1[0], packet1[1], packet1[2],
                            packet2[0], packet2[1], packet2[2],
                            ...defaultColor, 0.5, config().phase
                        );
                    }
                }
            });
        });
    });
});