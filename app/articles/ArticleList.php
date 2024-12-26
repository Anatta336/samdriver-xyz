<?php

namespace App\Articles;

use DOMDocument;
use DOMXPath;

class ArticleList
{
    const DATA_PATH = 'article-data/';

    private array $slugs;
    private array $articles;

    private string $dataPath;

    public function __construct()
    {
        $this->dataPath = self::DATA_PATH;
    }

    public function setDataPath(string $dataPath): void
    {
        $this->dataPath = $dataPath;
    }

    /**
     * @param bool $sort Whether to sort the articles by their sort order.
     * @return array<Article> Array of Article objects.
     */
    public function getArticles(bool $sort = true): array
    {
        if (isset($this->articles)) {
            return $this->articles;
        }

        if (!isset($this->slugs)) {
            $this->getSlugs();
        }

        $this->articles = [];

        foreach ($this->slugs as $slug) {
            $this->articles[] = Article::fromSlug($slug, $this->dataPath);
        }

        $this->articles = array_filter($this->articles, function (Article|null $article) {
            return !empty($article) && $article->exists();
        });

        if ($sort) {
            usort($this->articles, function (Article $a, Article $b) {
                return $b->getSort() <=> $a->getSort();
            });
        }

        return $this->articles;
    }

    public function getArticleCount(): int
    {
        return count($this->getArticles());
    }

    /**
     * @return array<string> Array of slugs, e.g. 'refraction-sphere'.
     */
    private function getSlugs(): array
    {
        if (isset($this->slugs)) {
            return $this->slugs;
        }

        $directories = new \DirectoryIterator($this->dataPath);
        $this->slugs = [];

        foreach ($directories as $directory) {
            if (!$this->isDirectoryValidArticle($directory)) {
                continue;
            }

            $this->slugs[] = $directory->getFilename();
        }

        return $this->slugs;
    }

    private function isDirectoryValidArticle(\DirectoryIterator $directory): bool
    {
        if (!$directory->isDir() || $directory->isDot()) {
            // Not a directory at all.
            return false;
        }

        $directoryPath = $directory->getPathname();
        $indexPath = $directoryPath.'/index.html';

        if (!file_exists($indexPath)) {
            // No index.html.
            return false;
        }

        $htmlContent = file_get_contents($indexPath);

        $document = new DOMDocument();
        // Suppress warnings from potentially malformed HTML
        @$document->loadHTML($htmlContent, LIBXML_NOERROR);

        $xpath = new DOMXPath($document);
        $metaPublic = $xpath->query('//meta[@name="public"]')->item(0);

        if ($metaPublic && $metaPublic->getAttribute('content') === 'false') {
            // Marked as not public.
            return false;
        }

        return true;
    }
}
