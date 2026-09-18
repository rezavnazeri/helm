export type DetectedTheme = 'light' | 'dark';

const WIDTH = 64;
const TOP_REGION = 0.30;

// Light is preferred when the result is ambiguous.
const DARK_THRESHOLD = 0.32;
const LIGHT_THRESHOLD = 0.45;

function luminance(r: number, g: number, b: number): number {
  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;

  const linear = (c: number) =>
    c <= 0.03928
      ? c / 12.92
      : Math.pow((c + 0.055) / 1.055, 2.4);

  return (
    0.2126 * linear(sr) +
    0.7152 * linear(sg) +
    0.0722 * linear(sb)
  );
}

export async function detectImageTheme(
  source: Blob | string,
): Promise<DetectedTheme> {
  const url =
    typeof source === 'string'
      ? source
      : URL.createObjectURL(source);

  const revoke = typeof source !== 'string';

  try {
    const image = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error('Unable to load wallpaper'));

        img.src = url;
      },
    );

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
    });

    if (!ctx) {
      return 'light';
    }

    const height = Math.max(
      1,
      Math.round((image.height / image.width) * WIDTH),
    );

    canvas.width = WIDTH;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, WIDTH, height);

    const pixels = ctx.getImageData(
      0,
      0,
      WIDTH,
      height,
    ).data;

    // Analyze only the top 30% of the wallpaper.
    // This corresponds more closely to the area behind Helm's header.
    const analysisHeight = Math.max(
      1,
      Math.ceil(height * TOP_REGION),
    );

    let totalLuminance = 0;
    let totalWeight = 0;

    for (let y = 0; y < analysisHeight; y += 2) {
      for (let x = 0; x < WIDTH; x += 2) {
        const i = (y * WIDTH + x) * 4;

        const alpha = pixels[i + 3] / 255;
        if (alpha === 0) continue;

        const l = luminance(
          pixels[i],
          pixels[i + 1],
          pixels[i + 2],
        );

        totalLuminance += l * alpha;
        totalWeight += alpha;
      }
    }

    const average =
      totalWeight > 0
        ? totalLuminance / totalWeight
        : 0;

    if (average <= DARK_THRESHOLD) {
      return 'dark';
    }

    if (average >= LIGHT_THRESHOLD) {
      return 'light';
    }

    return 'light';
  } finally {
    if (revoke) {
      URL.revokeObjectURL(url);
    }
  }
}