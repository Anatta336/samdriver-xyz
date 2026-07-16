<?php

namespace App\Includes;

/**
 * Floppy shell plastic colours, cassette-futurism palette.
 * Shared by the home page disks and the drive bay on article pages so an
 * article's disk keeps its colour when it has been "inserted".
 */
class DiskPalette
{
    public const SHELL_COLOURS = [
        '#31303a', // charcoal
        '#33518f', // cobalt
        '#1e6b66', // teal
        '#c8bda2', // putty beige
        '#b8552d', // burnt orange
        '#67683f', // olive
        '#96373b', // dusty red
        '#41414d', // slate
    ];

    /**
     * Stable shell colour for an article, seeded from its slug.
     */
    public static function shellColour(string $slug): string
    {
        $seed = crc32($slug);

        return self::SHELL_COLOURS[($seed >> 4) % count(self::SHELL_COLOURS)];
    }
}
