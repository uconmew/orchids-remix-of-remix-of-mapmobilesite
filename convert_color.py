import math

def hex_to_rgb(hex):
    hex = hex.lstrip('#')
    return tuple(int(hex[i:i+2], 16) / 255.0 for i in (0, 2, 4))

def linearize(c):
    return c / 12.92 if c <= 0.04045 else math.pow((c + 0.055) / 1.055, 2.4)

def rgb_to_oklab(r, g, b):
    l = 0.4122214708 * linearize(r) + 0.5363325363 * linearize(g) + 0.0514459929 * linearize(b)
    m = 0.2119034982 * linearize(r) + 0.6806995451 * linearize(g) + 0.1073969566 * linearize(b)
    s = 0.0883024619 * linearize(r) + 0.2817188376 * linearize(g) + 0.6299787005 * linearize(b)

    l_ = math.pow(l, 1/3)
    m_ = math.pow(m, 1/3)
    s_ = math.pow(s, 1/3)

    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

    return L, a, b_

def oklab_to_oklch(L, a, b):
    C = math.sqrt(a * a + b * b)
    h = math.atan2(b, a) * 180 / math.pi
    if h < 0: h += 360
    return L, C, h

hex_color = "#43c4e8"
r, g, b = hex_to_rgb(hex_color)
L_ok, a_ok, b_ok = rgb_to_oklab(r, g, b)
L, C, h = oklab_to_oklch(L_ok, a_ok, b_ok)

print(f"OKLCH: {L:.4f} {C:.4f} {h:.4f}")
