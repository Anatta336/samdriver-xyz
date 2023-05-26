<?php

namespace App\Articles;

use DateTimeImmutable;
use DOMDocument;

class Article
{
    const DATA_PATH = 'article-data/';

    protected string $slug;
    protected string $name;
    protected string $description;
    protected string $sort;
    protected string $path = '';

    public static function fromSlug(string $slug): Article|null
    {
        $article = new Article($slug);

        if (!$article->exists()) {
            return null;
        }

        return $article;
    }

    protected function __construct(string $slug)
    {
        $this->slug = $slug;

        $this->path = self::DATA_PATH."{$this->slug}/index.html";
    }

    public function exists(): bool
    {
        return file_exists($this->path);
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function getName(): string
    {
        if (!isset($this->name)) {
            $this->loadSummary();
        }

        return $this->name ?? '[Unknown]';
    }

    public function getDescription(): string
    {
        if (!isset($this->description)) {
            $this->loadSummary();
        }

        return $this->description ?? '-';
    }

    public function getSort(): string
    {
        if (!isset($this->sort)) {
            $this->loadSummary();
        }

        return $this->sort ?? '2000-01-00';
    }

    /**
     * @return string The <article> element, including the <article> element itself.
     */
    public function getContent(): string
    {
        $document = $this->getDocument();

        if (!$document) {
            // Unable to find and/or load file.
            return '';
        }

        /** @var \DomElement|null $articleElement */
        $articleElement = $document->getElementsByTagName('article')->item(0);

        if (!$articleElement) {
            // Missing essential content.
            return '';
        }

        $html = $document->saveHTML($articleElement);

        if ($html === false) {
            return '';
        }

        return $html;
    }

    /**
     * Date the article was last modified.
     */
    public function getLastModified(): DateTimeImmutable
    {
        return DateTimeImmutable::createFromFormat('U', filemtime($this->path));
    }

    protected function loadSummary(): void
    {
        $document = $this->getDocument();

        if (!$document) {
            // Unable to find and/or load file.
            return;
        }

        /** @var \DomElement|null */
        $headElement = $document->getElementsByTagName('head')->item(0);

        if (!$headElement) {
            // Missing essential content.
            return;
        }

        // Extract title.
        $this->name = $headElement->getElementsByTagName('title')->item(0)->textContent;

        // Look through the meta elements for the description and sort value.
        $metaElements = $headElement->getElementsByTagName('meta');
        foreach ($metaElements as $metaElement) {
            if ($metaElement->getAttribute('name') === 'description') {
                $this->description = $metaElement->getAttribute('content');
                continue;
            }

            if ($metaElement->getAttribute('name') === 'sort') {
                $this->sort = $metaElement->getAttribute('content');
                continue;
            }
        }
    }

    protected function getDocument(): ?DOMDocument
    {
        $document = new DOMDocument('5.0', 'utf-8');

        // Suppress warnings about "invalid" HTML (it doesn't know about HTML5).
        @$wasLoaded = $document->loadHTMLFile($this->path);

        if (!$wasLoaded) {
            return null;
        }

        return $document;
    }
}

