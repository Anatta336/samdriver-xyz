<?php

namespace App\Articles;

use DateTimeImmutable;
use DOMDocument;
use DOMXPath;

class Article
{
    private ?string $slug = null;
    private ?DOMDocument $document = null;
    private ?string $name = null;
    private ?string $description = null;
    private ?string $sort = null;
    private ?string $path = null;

    public static function fromSlug(string $slug, string $dataPath): Article|null
    {
        $article = new Article($dataPath, $slug);

        if (!$article->exists()) {
            return null;
        }

        // if (!$article->isAvailableToPublic()) {
        //     return null;
        // }

        return $article;
    }

    public function __construct(string $dataPath, string $slug)
    {
        $this->slug = $slug;

        $this->path = $dataPath."/{$this->slug}/index.html";
    }

    public function getPath(): string
    {
        return $this->path;
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
        if (empty($this->name)) {
            $this->loadSummary();
        }

        return $this->name ?? '[Unknown]';
    }

    public function getDescription(): string
    {
        if (empty($this->description)) {
            $this->loadSummary();
        }

        return $this->description ?? '-';
    }

    public function getSort(): string
    {
        if (empty($this->sort)) {
            $this->loadSummary();
        }

        return $this->sort ?? '2000-01-00';
    }

    /**
     * @return string The <article> element, including the <article> element itself.
     */
    public function getContent(): string
    {
        if (!$this->document) {
            $this->document = $this->getDocument();
        }

        if (!$this->document) {
            // Unable to find and/or load file.
            return '';
        }

        /** @var \DomElement|null $articleElement */
        $articleElement = $this->document->getElementsByTagName('article')->item(0);

        if (!$articleElement) {
            // Missing essential content.
            return '';
        }

        $html = $this->document->saveHTML($articleElement);

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

    public function isAvailableToPublic(): bool
    {
        if (!$this->document) {
            $this->document = $this->getDocument();
        }

        if (!$this->document) {
            // Unable to find and/or load file.
            return false;
        }

        $xpath = new DOMXPath($this->document);
        $metaPublic = $xpath->query('//meta[@name="public"]')->item(0);

        if ($metaPublic && $metaPublic->getAttribute('content') === 'false') {
            // Marked as not public.
            return false;
        }

        return true;
    }

    private function loadSummary(): void
    {
        if (!$this->document) {
            $this->document = $this->getDocument();
        }

        if (!$this->document) {
            // Unable to find and/or load file.
            return;
        }

        /** @var \DomElement|null */
        $headElement = $this->document->getElementsByTagName('head')->item(0);

        if (!$headElement) {
            // Missing essential content.
            return;
        }

        // Extract title.
        $this->name = $headElement->getElementsByTagName('title')->item(0)->textContent;

        // Look through the meta elements for the description and sort value.
        $metaElements = $headElement->getElementsByTagName('meta');

        /** @var DOMNode $metaElement */
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

    private function getDocument(): ?DOMDocument
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
