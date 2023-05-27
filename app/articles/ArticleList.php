<?php

namespace App\Articles;

class ArticleList
{
    const DATA_PATH = 'article-data/';

    protected array $slugs;
    protected array $articles;

    protected string $dataPath;

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
    protected function getSlugs(): array
    {
        if (isset($this->slugs)) {
            return $this->slugs;
        }

        $directories = new \DirectoryIterator($this->dataPath);

        $this->slugs = [];

        foreach ($directories as $directory) {
            if ($directory->isDir() && !$directory->isDot()) {
                $this->slugs[] = $directory->getFilename();
            }
        }

        return $this->slugs;
    }
}
