const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default function Head() {
  const url = `${SITE_URL}/`;
  const title = "SkyDrive - Arcade Flight Game";
  const description =
    "Play SkyDrive instantly. Collect rings, dodge obstacles, and climb the live ranking board.";
  const image = `${SITE_URL}/og-home.png`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="arcade flight game, browser flying game, leaderboard game, SkyDrive" />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
