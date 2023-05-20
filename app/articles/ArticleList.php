<?php

namespace App\Articles;

class ArticleList
{
    public static function getSlugs(): array
    {
        $directories = new \DirectoryIterator(Article::DATA_PATH);

        $slugs = [];

        foreach ($directories as $directory) {
            if ($directory->isDir() && !$directory->isDot()) {
                $slugs[] = $directory->getFilename();
            }
        }

        return $slugs;
    }

    public static function getArticles(): array
    {
        $slugs = self::getSlugs();

        $articles = [];

        foreach ($slugs as $slug) {
            $articles[] = new Article($slug);
        }

        return $articles;
    }
}
