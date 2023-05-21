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
            <link rel="stylesheet" href="/css/style.css">

            <head profile="http://www.w3.org/2005/10/profile">
            <link rel="icon" type="image/png" href="/favicon/gradient-32x32.png">

            <!-- TODO: RSS feed -->
            <!-- <link rel="alternate" href="/feed/" title="RSS feed" type="application/rss+xml"/> -->

            <meta name="description" content="{$description}"/>
            <meta name="author" content="Sam Driver">
            <title>{$title}</title>

            <link rel="preload" href="/fonts/roboto-v30-latin-regular.woff2" as="font" type="font/woff2" crossorigin/>

            <style>
            @font-face {
                font-display: swap;
                font-family: 'Roboto';
                font-style: normal;
                font-weight: 400;
                src: url('/fonts/roboto-v30-latin-regular.eot'); /* IE9 Compat Modes */
                src: url('/fonts/roboto-v30-latin-regular.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
                    url('/fonts/roboto-v30-latin-regular.woff2') format('woff2'), /* Super Modern Browsers */
                    url('/fonts/roboto-v30-latin-regular.woff') format('woff'), /* Modern Browsers */
                    url('/fonts/roboto-v30-latin-regular.ttf') format('truetype'), /* Safari, Android, iOS */
                    url('/fonts/roboto-v30-latin-regular.svg#Roboto') format('svg'); /* Legacy iOS */
            }
            /* roboto-700 - latin */
            @font-face {
                font-display: swap;
                font-family: 'Roboto';
                font-style: normal;
                font-weight: 700;
                src: url('/fonts/roboto-v30-latin-700.eot'); /* IE9 Compat Modes */
                src: url('/fonts/roboto-v30-latin-700.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
                    url('/fonts/roboto-v30-latin-700.woff2') format('woff2'), /* Super Modern Browsers */
                    url('/fonts/roboto-v30-latin-700.woff') format('woff'), /* Modern Browsers */
                    url('/fonts/roboto-v30-latin-700.ttf') format('truetype'), /* Safari, Android, iOS */
                    url('/fonts/roboto-v30-latin-700.svg#Roboto') format('svg'); /* Legacy iOS */
            }
            </style>
        </head>
        EOD;
    }
}
