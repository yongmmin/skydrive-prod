const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default function Head() {
  const url = `${SITE_URL}/rank`;
  const title = "SkyDrive Rank - Live Leaderboard";
  const description =
    "Check SkyDrive leaderboard rankings. Compare top scores and challenge the best pilots.";
  const image = `${SITE_URL}/og-rank.png`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="SkyDrive rank, leaderboard, top score, flight game ranking" />
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
