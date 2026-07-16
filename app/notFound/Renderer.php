<?php

namespace App\NotFound;

use App\Includes\Head;
use App\Includes\Nav;
use App\Includes\SmallPrint;

class Renderer
{
    /**
     * The 404 page: the terminal boots to a dark screen with no disk in
     * the drive.
     */
    public static function render(string $message = ''): string
    {
        $html = '<!DOCTYPE html><html lang="en">';

        // <head>
        $html .= Head::render('Not Found', '');

        $html .= '<body class="not-found">';

        $html .= '<header class="desk-plate">';
        $html .= '<h1>404 <span aria-hidden="true">//</span> Not Found</h1>';
        $html .= '<p>No article lives at this address</p>';
        $html .= '</header>';

        $html .= '<main class="monitor">';

        $html .= '<div class="monitor-top">';
        $html .= Nav::render();
        $html .= '<span class="monitor-brand" aria-hidden="true">SD&#8202;/&#8202;86 &middot; Personal Terminal</span>';
        $html .= '<span class="power-led" aria-hidden="true"></span>';
        $html .= '</div>';

        $detail = $message !== '' ? "\n".htmlentities($message) : '';

        $html .= '<div class="screen screen-dark">';
        $html .= '<pre class="term">';
        $html .= "SD/86 PERSONAL TERMINAL &middot; 64K RAM SYSTEM\n\n";
        $html .= "&gt; LOAD ARTICLE\n";
        $html .= '?FILE NOT FOUND  ERROR 404'.$detail."\n\n";
        $html .= 'NO DISK IN DRIVE. <a href="/">BROWSE THE DISK BOX</a> AND TRY ANOTHER.'."\n\n";
        $html .= 'READY.'."\n";
        $html .= '<span class="term-cursor" aria-hidden="true"></span>';
        $html .= '</pre>';
        $html .= '</div>';

        // Bottom bezel doubles as the page footer: vents and the small print.
        $html .= '<footer class="monitor-chin">';
        $html .= '<span class="chin-vents" aria-hidden="true"></span>';
        $html .= SmallPrint::render();
        $html .= '</footer>';

        $html .= '<span class="monitor-screw screw-tl" aria-hidden="true"></span>';
        $html .= '<span class="monitor-screw screw-tr" aria-hidden="true"></span>';
        $html .= '<span class="monitor-screw screw-bl" aria-hidden="true"></span>';
        $html .= '<span class="monitor-screw screw-br" aria-hidden="true"></span>';

        $html .= '</main>';

        $html .= '</body>';
        $html .= '</html>';

        return $html;
    }
}
