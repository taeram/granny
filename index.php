<?php

require __DIR__ . '/vendor/autoload.php';

use GuzzleHttp\Client as GuzzleClient;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Component\Yaml\Yaml;
use Symfony\Contracts\Cache\ItemInterface;

$cache = new FilesystemAdapter();
$config = Yaml::parseFile(__DIR__ . '/config.yml');
$title = $config['search_term'];

$cacheKey = md5($config['search_term']);
$gifs = $cache->get($cacheKey, function(ItemInterface $item) use ($config) {
  $item->expiresAfter(86400);

  $client = new GuzzleClient();
  $requestUrl = 'https://api.giphy.com/v1/gifs/search?api_key=' . $config['giphy_api_key'] . '&q=' . urlencode($config['search_term']) . '&limit=25&offset=0&rating=PG-13&lang=en';
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
} else {
  $cache->delete($cacheKey);
}

?><!doctype html>
<html class="no-js" lang="">
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title><?php echo $title; ?></title>
    <meta name="description" content="<?php echo $title; ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="background-color: <?php echo $config['background_colour']; ?>; margin-left: auto; margin-right: auto; width: <?php echo $gif['width']; ?>px">
<?php
if ($gif) {
  echo '<img src="' . $gif['url'] . '" style="width: ' . $gif['width'] . 'px; height: ' . $gif['height'] . 'px;" />';
}
else {
  echo '<strong>Error retrieving gif</strong>';
}
?>
<img src=" data:image/png;base64,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"
     style="position: absolute; right: 10px; bottom: 10px"
     alt="Powered by Giphy"/>
</body>
</html>
