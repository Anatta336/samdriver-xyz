<?php

namespace App\Articles;

use App\Includes\Head;
use App\Includes\Nav;
use App\Includes\SmallPrint;

class Renderer
{
    /**
     * Generate the full page of HTML: the article shown on a CRT terminal
     * sitting on the same desk as the home page.
     */
    public static function render(Article $article): string
    {
        $html = '<!DOCTYPE html><html lang="en">';

        // <head>
        $html .= Head::render($article->getName(), $article->getDescription());

        $html .= '<body class="article">';

        // Engraved desk plate carrying the article title and description.
        $html .= '<header class="desk-plate">';
        $html .= '<h1>'.htmlentities($article->getName()).'</h1>';
        $html .= '<p>'.htmlentities($article->getDescription()).'</p>';
        $html .= '</header>';

        // The monitor. Top bezel holds the drive bay (nav home) and LED.
        $html .= '<main class="monitor">';

        $html .= '<div class="monitor-top">';
        $html .= Nav::render($article->getSlug());
        $html .= '<span class="monitor-brand" aria-hidden="true">SD&#8202;/&#8202;86 &middot; Personal Terminal</span>';
        $html .= '<span class="power-led" aria-hidden="true"></span>';
        $html .= '</div>';

        // <article> on the tube.
        $html .= '<div class="screen">';
        $html .= $article->getContent();
        $html .= '</div>';

        // Bottom bezel doubles as the page footer: vents and the small print.
        $html .= '<footer class="monitor-chin">';
        $html .= SmallPrint::render();
        $html .= '<span class="chin-vents" aria-hidden="true"></span>';
        $html .= '</footer>';

        $html .= '<span class="monitor-screw screw-tl" aria-hidden="true"></span>';
        $html .= '<span class="monitor-screw screw-tr" aria-hidden="true"></span>';
        $html .= '<span class="monitor-screw screw-bl" aria-hidden="true"></span>';
        $html .= '<span class="monitor-screw screw-br" aria-hidden="true"></span>';

        $html .= '</main>';

        // Interaction script, cachebusted by modification time.
        $jsModified = @filemtime(__DIR__.'/../../public/js/article.js') ?: 0;
        $html .= '<script src="/js/article.js?v='.$jsModified.'" defer></script>';

        $html .= '</body>';
        $html .= '</html>';

        return $html;
    }
}
