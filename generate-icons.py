#!/usr/bin/env python3
"""Generate simple pink baby-themed icons as PNGs."""
import struct, zlib, math

def create_png(size):
    """Create a simple pink heart/baby icon PNG."""
    width = height = size

    # Create pixel data
    pixels = []
    cx, cy = width / 2, height / 2
    r = width * 0.38

    for y in range(height):
        row = []
        for x in range(width):
            nx = (x - cx) / r
            ny = (y - cy) / r

            # Background gradient: soft pink
            dist_center = math.sqrt((x - cx)**2 + (y - cy)**2)
            bg_r = min(255, int(253 - dist_center * 0.3))
            bg_g = min(255, int(220 - dist_center * 0.5))
            bg_b = min(255, int(232 - dist_center * 0.2))

            # Circle background
            in_circle = dist_center < (width * 0.45)

            # Heart shape
            heart = False
            if -1.2 < nx < 1.2 and -0.8 < ny < 1.4:
                # Heart formula
                hx, hy = nx, ny - 0.2
                val = (hx**2 + hy**2 - 1)**3 - hx**2 * hy**3
                heart = val <= 0

            if heart:
                pr, pg, pb = 244, 114, 182  # pink-400
                pa = 255
            elif in_circle:
                # Soft pink circle background
                t = dist_center / (width * 0.45)
                pr = int(253 - t * 30)
                pg = int(214 - t * 30)
                pb = int(228 - t * 20)
                pa = 255
            else:
                pr, pg, pb = 253, 242, 248  # pink-50 background
                pa = 255

            row.extend([pr, pg, pb, pa])
        pixels.append(row)

    # Build PNG
    def pack_chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    # Wait, RGBA is color type 6
    ihdr_data = struct.pack('>II', width, height) + bytes([8, 6, 0, 0, 0])

    # IDAT
    raw_data = b''
    for row in pixels:
        raw_data += b'\x00' + bytes(row)
    compressed = zlib.compress(raw_data, 9)

    png = b'\x89PNG\r\n\x1a\n'
    png += pack_chunk(b'IHDR', ihdr_data)
    png += pack_chunk(b'IDAT', compressed)
    png += pack_chunk(b'IEND', b'')
    return png

for size in [192, 512]:
    data = create_png(size)
    with open(f'public/icon-{size}.png', 'wb') as f:
        f.write(data)
    print(f'Created icon-{size}.png')
print('Done!')
