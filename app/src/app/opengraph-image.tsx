import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const alt = "名作のかけら Bookshard — Collect the classics, word by word";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static brand card shown when the app's link is posted on X and other SNS,
// so the preview is a designed card instead of a bare title-only link.
export default async function OpengraphImage() {
  const fontsDir = path.join(process.cwd(), "src/fonts");
  const [notoSerifJp, playfair] = await Promise.all([
    readFile(path.join(fontsDir, "NotoSerifJP-Bold.ttf")),
    readFile(path.join(fontsDir, "PlayfairDisplay-SemiBold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e3b2c",
          backgroundImage:
            "radial-gradient(circle at 22% 20%, rgba(169,134,55,0.28), transparent 42%), radial-gradient(circle at 80% 85%, rgba(169,134,55,0.18), transparent 45%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#a98637",
            marginBottom: 36,
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair Display",
            fontSize: 26,
            letterSpacing: 14,
            color: "#c8b078",
            marginBottom: 20,
          }}
        >
          BOOKSHARD
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Noto Serif JP",
            fontSize: 108,
            color: "#f5efdf",
            letterSpacing: 12,
            lineHeight: 1,
          }}
        >
          名作のかけら
        </div>
        <div
          style={{
            display: "flex",
            width: 220,
            height: 1,
            background: "#a98637",
            marginTop: 40,
            marginBottom: 40,
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair Display",
            fontSize: 30,
            color: "#e5dcc3",
            letterSpacing: 1,
          }}
        >
          Collect the classics, word by word.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Serif JP", data: notoSerifJp, weight: 700, style: "normal" },
        { name: "Playfair Display", data: playfair, weight: 600, style: "normal" },
      ],
    }
  );
}
