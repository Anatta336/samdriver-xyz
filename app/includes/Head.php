<?php

namespace App\Includes;

class Head
{
    public static function render(string $title = '', string $description = ''): string
    {
        $title = htmlentities($title);
        $description = htmlentities($description);

        return <<<EOD
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto&family=Roboto+Mono&display=swap">
            <link rel="stylesheet" href="/css/style.css">

            <!-- Favicon -->
            <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png">
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
            <link rel="manifest" href="/favicon/site.webmanifest">
            <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#2a8625">
            <meta name="msapplication-TileColor" content="#2b5797">
            <meta name="theme-color" content="#ffffff">

            <!-- TODO: RSS feed -->
            <!-- <link rel="alternate" href="/feed/" title="RSS feed" type="application/rss+xml"/> -->

            <meta name="description" content="{$description}"/>
            <meta name="author" content="Sam Driver">
            <title>{$title}</title>
        </head>
        EOD;
    }
}
