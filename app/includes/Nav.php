<?php

namespace App\Includes;

use App\Articles\ArticleList;

class Nav
{
    public static function render(): string
    {
        $count = (new ArticleList())->getArticleCount();

        $html = '<nav><a class="home" href="/" aria-label="View articles list">';

        $html .= '<div class="pseudo-header"></div>';

        for ($i = 0; $i < $count; $i++) {
            $html .= '<div class="pseudo-link"></div>';
        }

        $html .= '</a></nav>';

        return $html;
    }
}
