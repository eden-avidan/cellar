// The one output format for clean bottle photos, taken from the Kishor GSM photo the owner approved:
// a 1080x1080 white square, the bottle trimmed of its own margins, 896 px tall (83% of the height, as
// in that photo), centred. Thumbnail: the same square at 480x480.
const { sharp } = require('./fb.cjs');

const SIZE = 1080;
const BOTTLE_HEIGHT = 896;
const MAX_BOTTLE_WIDTH = 760; // magnums / wide bottles: never touch the sides
const THUMB = 480;
const FORMAT = 'square1080-v1'; // stored on the photo, so the skill can tell standardized photos apart

const img = (buf) => sharp(buf, { limitInputPixels: 40e6 });

async function standardize(original) {
  const flat = await img(original).rotate().flatten({ background: '#ffffff' }).toBuffer();
  // Trim the shop's white margins so every bottle ends up the same size in the frame.
  const trimmed = await img(flat).trim({ background: '#ffffff', threshold: 18 }).toBuffer();
  const bottle = await img(trimmed)
    .resize({ width: MAX_BOTTLE_WIDTH, height: BOTTLE_HEIGHT, fit: 'inside', kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });
  const full = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: '#ffffff' } })
    .composite([{ input: bottle.data, left: Math.round((SIZE - bottle.info.width) / 2), top: Math.round((SIZE - bottle.info.height) / 2) }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  const thumb = await img(full).resize(THUMB, THUMB).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const trimmedMeta = await img(trimmed).metadata();
  return { full, thumb, bottle: bottle.info, sourceBottle: { width: trimmedMeta.width, height: trimmedMeta.height } };
}

module.exports = { standardize, SIZE, THUMB, FORMAT };
