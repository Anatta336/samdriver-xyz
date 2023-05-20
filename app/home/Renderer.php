<?php

namespace App\Home;

use App\Includes\Footer;
use App\Includes\Head;

class Renderer
{
    /**
     * Generates string for the full page of HTML of the 404 page.
     */
    public static function render(): string
    {
        $html = '<!DOCTYPE html><html lang="en">';

        // <head>
        $html .= Head::render('Sam Driver', 'Articles and tutorials on game and web development');

        $html .= '<body>';

        // TODO: contents of home page.
        $html .= '<h1>Test</h1>';

        // <footer>
        $html .= Footer::render();

        $html .= '</body>';
        $html .= '</html>';

        return $html;
    }
}
