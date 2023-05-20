<?php

namespace App\Home;

use App\Articles\ArticleList;
use App\Includes\Footer;
use App\Includes\Head;

class Renderer
{
    /**
     * Generates string for the full page of HTML of the home page.
     */
    public static function render(): string
    {
        $html = '<!DOCTYPE html><html lang="en">';

        // <head>
        $html .= Head::render('Sam Driver', 'Articles and tutorials on game and web development');

        $html .= '<body>';

        $html .= '<header>';
        $html .= '<h1>Articles and Tutorials</h1>';
        $html .= '<p>Articles and tutorials on game and web development</p>';
        $html .= '</header>';

        foreach ((new ArticleList())->getArticles() as $article) {
            if (empty($article) || !$article->exists()) {
                continue;
            }

            $html .= '<a class="article-link-block" href="/article/'.$article->getSlug().'">';
            $html .= '<h2>'.htmlentities($article->getName()).'</h2>';
            $html .= '<p>'.htmlentities($article->getDescription()).'</p>';
            $html .= '</a>';
        }

        // <footer>
        $html .= Footer::render();

        $html .= '</body>';
        $html .= '</html>';

        return $html;
    }
}
