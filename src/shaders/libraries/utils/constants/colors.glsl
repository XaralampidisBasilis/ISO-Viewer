#ifndef COLOR_CONSTANTS
#define COLOR_CONSTANTS

struct ColorConstants {
    // Basic
    vec3 BLACK;
    vec3 WHITE;
    vec3 GRAY;
    vec3 LIGHT_GRAY;
    vec3 DARK_GRAY;
    vec3 TRANSPARENT;

    // Primary
    vec3 RED;
    vec3 GREEN;
    vec3 BLUE;

    vec3 LIGHT_RED;
    vec3 LIGHT_GREEN;
    vec3 LIGHT_BLUE;
    
    vec3 DARK_RED;
    vec3 DARK_GREEN;
    vec3 DARK_BLUE;

    // Secondary
    vec3 CYAN;
    vec3 MAGENTA;
    vec3 YELLOW;
    vec3 LIGHT_CYAN;
    vec3 LIGHT_MAGENTA;
    vec3 LIGHT_YELLOW;
    vec3 DARK_CYAN;
    vec3 DARK_MAGENTA;
    vec3 DARK_YELLOW;

    // Pastels
    vec3 PASTEL_RED;
    vec3 PASTEL_GREEN;
    vec3 PASTEL_BLUE;
    vec3 PASTEL_CYAN;
    vec3 PASTEL_MAGENTA;
    vec3 PASTEL_YELLOW;
    vec3 PASTEL_ORANGE;
    vec3 PASTEL_PINK;
    vec3 PASTEL_PURPLE;

    // Extended
    vec3 ORANGE;
    vec3 PINK;
    vec3 PURPLE;
    vec3 BROWN;
    vec3 TEAL;
    vec3 INDIGO;

    vec3 LIGHT_ORANGE;
    vec3 LIGHT_PINK;
    vec3 LIGHT_PURPLE;
    vec3 LIGHT_BROWN;
    vec3 LIGHT_TEAL;
    vec3 LIGHT_INDIGO;

    vec3 DARK_ORANGE;
    vec3 DARK_PINK;
    vec3 DARK_PURPLE;
    vec3 DARK_BROWN;
    vec3 DARK_TEAL;
    vec3 DARK_INDIGO;

    // Rich tones for geometric shading
    vec3 NAVY;
    vec3 LIME;
    vec3 SAND;
    vec3 SKY;
    vec3 MAROON;
    vec3 FOREST;

    // Metallics
    vec3 GOLD;
    vec3 SILVER;
};

const ColorConstants COLOR = ColorConstants(
    // Basic
    vec3(0.0, 0.0, 0.0),       // BLACK
    vec3(1.0, 1.0, 1.0),       // WHITE
    vec3(0.5, 0.5, 0.5),       // GRAY
    vec3(0.8, 0.8, 0.8),       // LIGHT_GRAY
    vec3(0.3, 0.3, 0.3),       // DARK_GRAY
    vec3(0.0, 0.0, 0.0),       // TRANSPARENT

    // Primary
    vec3(1.0, 0.0, 0.0),       // RED
    vec3(0.0, 1.0, 0.0),       // GREEN
    vec3(0.0, 0.0, 1.0),       // BLUE

    vec3(1.0, 0.4, 0.4),       // LIGHT_RED
    vec3(0.5, 1.0, 0.5),       // LIGHT_GREEN
    vec3(0.4, 0.6, 1.0),       // LIGHT_BLUE

    vec3(0.4, 0.05, 0.05),     // DARK_RED
    vec3(0.0, 0.3, 0.0),       // DARK_GREEN
    vec3(0.05, 0.05, 0.4),     // DARK_BLUE

    // Secondary
    vec3(0.0, 1.0, 1.0),       // CYAN
    vec3(1.0, 0.0, 1.0),       // MAGENTA
    vec3(1.0, 1.0, 0.0),       // YELLOW

    vec3(0.6, 1.0, 1.0),       // LIGHT_CYAN
    vec3(1.0, 0.6, 1.0),       // LIGHT_MAGENTA
    vec3(1.0, 1.0, 0.6),       // LIGHT_YELLOW

    vec3(0.0, 0.4, 0.4),       // DARK_CYAN
    vec3(0.4, 0.0, 0.4),       // DARK_MAGENTA
    vec3(0.5, 0.5, 0.0),       // DARK_YELLOW

    // Pastels
    vec3(1.0, 0.6, 0.6),       // PASTEL_RED
    vec3(0.6, 1.0, 0.6),       // PASTEL_GREEN
    vec3(0.6, 0.6, 1.0),       // PASTEL_BLUE
    vec3(0.6, 1.0, 1.0),       // PASTEL_CYAN
    vec3(1.0, 0.6, 1.0),       // PASTEL_MAGENTA
    vec3(1.0, 1.0, 0.6),       // PASTEL_YELLOW
    vec3(1.0, 0.8, 0.6),       // PASTEL_ORANGE
    vec3(1.0, 0.8, 0.9),       // PASTEL_PINK
    vec3(0.8, 0.6, 1.0),       // PASTEL_PURPLE

    // Extended
    vec3(1.0, 0.5, 0.0),    // ORANGE
    vec3(1.0, 0.75, 0.8),   // PINK
    vec3(0.5, 0.0, 0.5),    // PURPLE
    vec3(0.6, 0.3, 0.0),    // BROWN
    vec3(0.0, 0.5, 0.5),    // TEAL
    vec3(0.3, 0.0, 0.5),    // INDIGO

    vec3(1.0, 0.7, 0.3),    // LIGHT_ORANGE
    vec3(1.0, 0.85, 0.9),   // LIGHT_PINK
    vec3(0.8, 0.6, 1.0),    // LIGHT_PURPLE
    vec3(0.8, 0.6, 0.4),    // LIGHT_BROWN
    vec3(0.4, 0.8, 0.8),    // LIGHT_TEAL
    vec3(0.6, 0.4, 0.9),    // LIGHT_INDIGO

    vec3(0.7, 0.3, 0.0),    // DARK_ORANGE
    vec3(0.8, 0.4, 0.5),    // DARK_PINK
    vec3(0.3, 0.0, 0.3),    // DARK_PURPLE
    vec3(0.4, 0.2, 0.0),    // DARK_BROWN
    vec3(0.0, 0.3, 0.3),    // DARK_TEAL
    vec3(0.2, 0.0, 0.4),     // DARK_INDIGO

    // Rich tones
    vec3(0.0, 0.0, 0.3),       // NAVY
    vec3(0.6, 1.0, 0.4),       // LIME
    vec3(0.94, 0.87, 0.72),    // SAND
    vec3(0.6, 0.8, 1.0),       // SKY
    vec3(0.5, 0.0, 0.0),       // MAROON
    vec3(0.13, 0.55, 0.13),    // FOREST

    // Metallics
    vec3(1.0, 0.84, 0.0),      // GOLD
    vec3(0.75, 0.75, 0.75)     // SILVER
);

#endif // COLOR_CONSTANTS
