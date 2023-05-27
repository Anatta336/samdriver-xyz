<?php

namespace Tests\Articles;

require_once __DIR__.'/../../vendor/autoload.php';

use App\Articles\Article;
use App\Articles\ArticleList;
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

class ArticleListTest extends TestCase
{
    protected vfsStreamDirectory $root;

    protected function setUp(): void
    {
        $this->root = vfsStream::setup('article-data');
        vfsStream::create(
            [
                'example-one' => [
                    'index.html' => '<html>Content one</html>',
                    'image.webp' => '...',
                ],
                'example-two' => [
                    'index.html' => '<html>Content two</html>',
                    'video.webm' => '...',
                ],
                'index.html' => '<html>Content three</html>',
                'example-four' => [
                    'image.webp' => '...',
                ],
            ], $this->root
        );
    }

    public function testGetArticles(): void
    {
        $articleList = new ArticleList();
        $articleList->setDataPath($this->root->url());

        $articles = $articleList->getArticles();

        $this->assertIsArray($articles);
        $this->assertNotEmpty($articles);
        $this->assertContainsOnlyInstancesOf(Article::class, $articles);
        $this->assertCount(2, $articles);

        $slugs = array_map(function (Article $article) {
            return $article->getSlug();
        }, $articles);

        $this->assertNotEmpty($slugs);
        $this->assertContains('example-one', $slugs);
        $this->assertContains('example-two', $slugs);

        // Didn't include a index.html file outside a directory.
        $this->assertNotContains('example-three', $slugs);

        // Didn't include a directory that's lacking index.html.
        $this->assertNotContains('example-four', $slugs);
    }
}