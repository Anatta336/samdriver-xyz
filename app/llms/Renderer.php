<?php

namespace App\Llms;

use App\Articles\ArticleList;
use App\Includes\Site;

/**
 * The llms.txt index, as specified at https://llmstxt.org: an H1 naming the
 * site, a blockquote summarising it, then the articles as a list of links.
 *
 * Each entry points at the article's Markdown rendering rather than the page
 * itself, so a reader that follows a link gets the writing without the
 * skeumorphic furniture around it.
 */
class Renderer
{
    public static function render(): string
    {
        $markdown = '# '.Site::NAME."\n\n";
        $markdown .= '> '.Site::DESCRIPTION.".\n\n";
        $markdown .= "Articles are linked as Markdown. Drop the .md suffix for the page itself, "
            ."which carries the interactive demos the Markdown can only describe.\n\n";
        $markdown .= "## Articles\n\n";

        foreach ((new ArticleList())->getArticles() as $article) {
            $markdown .= '- ['.$article->getName().']('
                .Site::URL.'/article/'.$article->getSlug().'.md): '
                .$article->getDescription()."\n";
        }

        return $markdown;
    }
}
