<?php

namespace Tests\Articles;

require_once __DIR__.'/../../vendor/autoload.php';

use App\Articles\Article;
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

class ArticleTest extends TestCase
{
    protected vfsStreamDirectory $root;

    protected function setUp(): void
    {
        $this->root = vfsStream::setup('article-data');
        vfsStream::create(
            [
                'measured' => [
                    'index.html' => <<<'EOD'
                    <html><head>
                        <title>A Measured Article</title>
                        <meta name="description" content="Has been through the measuring rig.">
                        <meta name="sort" content="2025-04-12">
                        <meta name="size" content="2412034">
                    </head><body><article>Content</article></body></html>
                    EOD,
                ],
                'unmeasured' => [
                    'index.html' => <<<'EOD'
                    <html><head>
                        <title>An Unmeasured Article</title>
                        <meta name="description" content="Never been measured.">
                        <meta name="sort" content="1970-01-09">
                    </head><body><article>Content</article></body></html>
                    EOD,
                ],
            ], $this->root
        );
    }

    public function testGetSizeReadsTheSizeMeta(): void
    {
        $article = Article::fromSlug('measured', $this->root->url());

        $this->assertSame(2412034, $article->getSize());
    }

    public function testGetSizeIsNullWhenNotMeasured(): void
    {
        $article = Article::fromSlug('unmeasured', $this->root->url());

        $this->assertNull($article->getSize());
    }

    public function testGetSizeDoesNotDisturbTheOtherMetadata(): void
    {
        $article = Article::fromSlug('measured', $this->root->url());

        $this->assertSame('A Measured Article', $article->getName());
        $this->assertSame('Has been through the measuring rig.', $article->getDescription());
        $this->assertSame('2025-04-12', $article->getSort());
    }

    /**
     * An unmeasured article must not re-parse the document on every getSize()
     * call just because the value it caches is legitimately null.
     */
    public function testSummaryIsParsedOnlyOnce(): void
    {
        $article = Article::fromSlug('unmeasured', $this->root->url());

        $this->assertNull($article->getSize());

        // Pull the file out from under it; a second parse would now fail and
        // the fallbacks would kick in.
        unlink($this->root->url().'/unmeasured/index.html');

        $this->assertNull($article->getSize());
        $this->assertSame('An Unmeasured Article', $article->getName());
    }
}
