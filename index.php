<?php

require __DIR__ . '/vendor/autoload.php';

use GuzzleHttp\Client as GuzzleClient;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Component\Yaml\Yaml;
use Symfony\Contracts\Cache\ItemInterface;

$cache = new FilesystemAdapter();
$config = Yaml::parseFile(__DIR__ . '/config.yml');
$title = $_SERVER['SERVER_NAME'] ?? 'Welcome';

$cacheKey = md5($config['search_term']);
$gifs = $cache->get($cacheKey, function(ItemInterface $item) use ($config) {
  $item->expiresAfter(86400);

  $client = new GuzzleClient();
  $requestUrl = 'https://api.giphy.com/v1/gifs/search?api_key=' . $config['giphy_api_key'] . '&q=' . urlencode($config['search_term']) . 'limit=25&offset=0&rating=PG-13&lang=en';
  try {
    $response = $client->request('GET', $requestUrl);
    if ($response->getStatusCode() === 200) {
      return json_decode($response->getBody(), TRUE);
    }
  } catch (Exception $e) {
    // noop.
  }
  return NULL;
});

// Select a random gif.
$gif = NULL;
if ($gifs) {
  $index = random_int(0, count($gifs['data']) - 1);
  $gif = $gifs['data'][$index]['images']['original'];
}

?><!doctype html>
<html class="no-js" lang="">
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title><?php echo $title; ?></title>
    <meta name="description" content="<?php echo $title; ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="apple-touch-icon" sizes="57x57"
          href="/favicon/apple-touch-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60"
          href="/favicon/apple-touch-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72"
          href="/favicon/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76"
          href="/favicon/apple-touch-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114"
          href="/favicon/apple-touch-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120"
          href="/favicon/apple-touch-icon-120x120.png">
    <link rel="icon" type="image/png" href="/favicon/favicon-32x32.png"
          sizes="32x32">
    <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png"
          sizes="96x96">
    <link rel="icon" type="image/png" href="/favicon/favicon-16x16.png"
          sizes="16x16">
    <link rel="manifest" href="/favicon/manifest.json">
    <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5">
    <link rel="shortcut icon" href="/favicon/favicon.ico">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="msapplication-config" content="/favicon/browserconfig.xml">
    <meta name="theme-color" content="#ffffff">
</head>
<body style="background-color: #69DFFD; margin-left: auto; margin-right: auto; width: <?php echo $gif['width']; ?>px">
<?php
if ($gif) {
  echo '<img src="' . $gif['url'] . '" style="width: ' . $gif['width'] . 'px; height: ' . $gif['height'] . 'px;" />';
}
else {
  echo '<strong>Error retrieving gif</strong>';
}
?>
<img src="/img/powered-by-giphy.png"
     style="position: absolute; right: 10px; bottom: 10px"
     alt="Powered by Giphy"/>
</body>
</html>
