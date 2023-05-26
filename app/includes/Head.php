<?php

namespace App\Includes;

class Head
{
    public static function render(string $title = '', string $description = ''): string
    {
        $title = htmlentities($title);
        $description = htmlentities($description);

        // Cachebusting for CSS.
        $cssModified = filemtime(__DIR__.'/../../public/css/style.css');

        return <<<EOD
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/css/style.{$cssModified}.css">

            <head profile="http://www.w3.org/2005/10/profile">
            <link rel="icon" type="image/png" href="/favicon/gradient-32x32.png">

            <!-- TODO: RSS feed -->
            <!-- <link rel="alternate" href="/feed/" title="RSS feed" type="application/rss+xml"/> -->

            <meta name="description" content="{$description}"/>
            <meta name="author" content="Sam Driver">
            <title>{$title}</title>

            <link rel="preload" href="/fonts/roboto-v30-latin-regular.woff2" as="font" type="font/woff2" crossorigin/>
            <link rel="preload" href="/fonts/roboto-v30-latin-700.woff2" as="font" type="font/woff2" crossorigin/>

        </head>
        EOD;
    }
}
