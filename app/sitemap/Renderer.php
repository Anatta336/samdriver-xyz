<?php

namespace App\Sitemap;

use App\Articles\ArticleList;
use DateTimeImmutable;

class Renderer {
    public static function render(): string
    {
        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";

        $articles = (new ArticleList())->getArticles();

        $mostRecentChange = DateTimeImmutable::createFromFormat('Y-m-d', '2020-01-01');

        foreach ($articles as $article) {
            $lastModified = $article->getLastModified();

            if ($lastModified > $mostRecentChange) {
                $mostRecentChange = $lastModified;
            }

            $xml .= "<url>\n";
            $xml .= '<loc>https://samdriver.xyz/article/'.$article->getSlug()."</loc>\n";
            $xml .= '<lastmod>'.$lastModified->format('Y-m-d')."</lastmod>\n";
            $xml .= "</url>\n";
        }

        $xml .= "<url>\n";
        $xml .= "<loc>https://samdriver.xyz/</loc>\n";
        $xml .= '<lastmod>'.$mostRecentChange->format('Y-m-d')."</lastmod>\n";
        $xml .= "</url>\n";

        $xml .= '</urlset>';

        return $xml;
    }
}
