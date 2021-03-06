import { PNG } from "pngjs";
import Jimp from "jimp";
import fs from "floyd-steinberg";
import { bwConversion } from "./bwConversion";
import { bitConversion } from "./bufferToHexString";
import { encode } from "./uint8ToBase64";

export const convertFile = (
  imageArrayBuffer: ArrayBuffer,
  width: number,
  height: number,
  contrast: number,
  invert: boolean,
  dither: boolean
): Promise<{ base64: string; hex: string; binary: Buffer }> => {
  return new Promise(async resolve => {
    const pngImage = new PNG();
    const jimpImage = await Jimp.read(Buffer.from(imageArrayBuffer));
    if (invert) jimpImage.invert();
    await jimpImage.contrast(contrast);
    jimpImage.autocrop().scaleToFit(width, height);
    const jimpPNG = await jimpImage.getBufferAsync("image/png");

    pngImage.parse(jimpPNG, async (err, data) => {
      if (dither) data = fs(data);
      const buffer = PNG.sync.write(data);
      const jimpImage = await Jimp.read(buffer);
      const background = new Jimp(width, height, "black");
      background.composite(
        jimpImage,
        width / 2 - jimpImage.getWidth() / 2,
        height / 2 - jimpImage.getHeight() / 2
      );
      const converted = bwConversion(background, width, height);
      // slice removes bitmap header
      const hexConverted = bitConversion(converted.rgba.slice(55), width);
      resolve({
        base64: "data:image/bmp;base64," + encode(converted.rgb),
        hex: hexConverted,
        binary: converted.binary
      });
    });
  });
};
