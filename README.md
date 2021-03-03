# granny
Displays a random gif on each page load for specific search terms.

## Setup

1. Copy `config.sample.yml` to `config.yml`
2. Sign up for a [GIPHY](https://developers.giphy.com/) developer account, and generate an API key.
3. Update `config.yml` with your GIPHY API key, and your preferred search term.
4. Install the [Composer](https://getcomposer.org/download/) dependencies with: `composer install`
5. Start up a PHP development server `php -S 0.0.0.0:8080`
6. Visit the page in your browser: `http://localhost:8080/`
