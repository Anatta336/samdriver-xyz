<?php

namespace App\Includes;

/**
 * Byte counts as a disk label would print them: decimal units, because that is
 * how floppies were always sold (the "1.44 MB" disk held 1,474,560 bytes).
 *
 * Returns plain text; escaping is the caller's business.
 */
class FileSize
{
    public static function format(int $bytes): string
    {
        if ($bytes < 1000) {
            return $bytes.' B';
        }

        if ($bytes < 1000000) {
            return round($bytes / 1000).' kB';
        }

        return number_format($bytes / 1000000, 1).' MB';
    }
}
