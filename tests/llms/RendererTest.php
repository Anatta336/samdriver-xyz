<?php

namespace Tests\Llms;

require_once __DIR__.'/../../vendor/autoload.php';

use App\Llms\Renderer;
use PHPUnit\Framework\TestCase;

class RendererTest extends TestCase
{
    private string $markdown;

    protected function setUp(): void
    {
        // ArticleList reads the real article-data directory, relative to the
        // document root, the same as it does when serving a request.
        $previousDirectory = getcwd();
        chdir(__DIR__.'/../../public');

        $this->markdown = Renderer::render();

        chdir($previousDirectory);
    }

    /**
     * The llms.txt spec (https://llmstxt.org) wants an H1 followed by a
     * blockquote summarising the site.
     */
    public function testOpensWithAnH1AndBlockquote(): void
    {
        $this->assertMatchesRegularExpression('/\A# .+\n\n> .+\n/', $this->markdown);
    }

    public function testListsArticlesUnderAnH2(): void
    {
        $this->assertStringContainsString("\n## Articles\n", $this->markdown);

        $articles = substr($this->markdown, strpos($this->markdown, '## Articles'));

        // Every entry is a link with a note, and there's more than one of them.
        $matches = preg_match_all(
            '/^- \[[^\]]+\]\(https:\/\/samdriver\.xyz\/article\/[a-z0-9-]+\.md\): .+$/m',
            $articles,
            $links
        );

        $this->assertGreaterThan(1, $matches);

        // Nothing in the list is anything other than such an entry.
        $listItems = preg_match_all('/^- /m', $articles);
        $this->assertSame($listItems, $matches);
    }

    /**
     * Drafts are left out of the index, as they are out of the sitemap.
     */
    public function testOmitsDraftArticles(): void
    {
        $this->assertStringNotContainsString('flight-prototype', $this->markdown);
    }

    public function testHasNoHeadingsBelowTheArticleList(): void
    {
        // A stray H1 would start a second document as far as a reader's
        // concerned, and the spec allows only the one.
        $this->assertSame(1, preg_match_all('/^# /m', $this->markdown));
    }
}
