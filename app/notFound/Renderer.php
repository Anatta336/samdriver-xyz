<?php

namespace App\NotFound;

use App\Includes\Footer;
use App\Includes\Head;
use App\Includes\Nav;

class Renderer
{
    /**
     * Generates string for the full page of HTML of the 404 page.
     */
    public static function render(string $message = ''): string
    {
        $html = '<!DOCTYPE html><html lang="en">';

        // <head>
        $html .= Head::render('Not Found', '');

        $html .= '<body>';

        // <nav>
        $html .= Nav::render();

        $html .= '<header>';
        $html .= '<h1>404 - Not Found</h1>';
        $html .= '<p>'.htmlentities($message).'</p>';
        $html .= '</header>';

        // <footer>
        $html .= Footer::render();

        $html .= '</body>';
        $html .= '</html>';

        return $html;
    }
}
