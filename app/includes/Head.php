<?php

namespace App\Includes;

class Head
{
    public static function render(
        string $title = '',
        string $description = '',
        string $styleSheetPath = '/css/style.css'
    ): string {
        $title = htmlentities($title);
        $description = htmlentities($description);

        // Shared desk styles first, then the page's own stylesheet.
        // Both cachebusted by modification time.
        $styleSheetLinks = '';
        foreach (['/css/desk.css', $styleSheetPath] as $path) {
            $modified = filemtime(__DIR__.'/../../public'.$path);
            $pathWithoutCss = str_replace('.css', '', $path);
            $styleSheetLinks .= '<link rel="stylesheet" href="'.$pathWithoutCss.'.'.$modified.'.css">'."\n    ";
        }

        return <<<EOD
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            {$styleSheetLinks}

            <head profile="http://www.w3.org/2005/10/profile">
            <link rel="icon" type="image/png" href="/favicon/disk-128px.png">

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
