<?php

namespace App\Articles;

use App\Includes\Footer;
use App\Includes\Head;

class Renderer
{
    /**
     * Generate the full page of HTML.
     */
    public static function render(Article $article): string
    {
        $html = '<!DOCTYPE html><html lang="en">';

        // <head>
        $html .= Head::render($article->getName(), $article->getDescription());

        $html .= '<body>';

        // <header>
        $html .= '<header>';
        $html .= '<h1>'.htmlentities($article->getName()).'</h1>';
        $html .= '<p>'.htmlentities($article->getDescription()).'</p>';
        $html .= '</header>';

        // <article>
        $html .= $article->getContent();

        // <footer>
        $html .= Footer::render();

        $html .= '</body>';
        $html .= '</html>';

        return $html;
    }
}
