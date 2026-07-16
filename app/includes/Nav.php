<?php

namespace App\Includes;

class Nav
{
    /**
     * Site navigation as a drive bay on the monitor bezel: the article's
     * disk sits in the slot, and ejecting it returns to the article list.
     *
     * @param string|null $slug Slug of the loaded article; null leaves the
     *                          slot empty (e.g. the 404 page).
     */
    public static function render(?string $slug = null): string
    {
        $hasDisk = $slug !== null;

        $disk = '';
        if ($hasDisk) {
            $shell = DiskPalette::shellColour($slug);
            $disk = '<span class="bay-disk" style="--shell: '.$shell.';"></span>';
        }

        $label = $hasDisk ? 'Eject' : 'Get disks';
        $ariaLabel = $hasDisk
            ? 'Eject disk and return to the article list'
            : 'Return to the article list';

        $html = '<nav aria-label="Main">';
        $html .= '<a class="eject-bay" href="/" aria-label="'.$ariaLabel.'">';
        $html .= '<span class="bay-slot" aria-hidden="true">'.$disk.'</span>';
        $html .= '<span class="eject-btn" aria-hidden="true">&#9167;</span>';
        $html .= '<span class="eject-label">'.$label.'</span>';
        $html .= '</a>';
        $html .= '</nav>';

        return $html;
    }
}
