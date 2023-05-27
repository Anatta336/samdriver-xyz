<?php

namespace App\Routes;

use App\Articles\Article;
use App\Articles\ArticleList;
use App\Articles\Renderer;
use App\Home\Renderer as HomeRenderer;
use App\NotFound\Renderer as NotFoundRenderer;
use App\Sitemap\Renderer as SitemapRenderer;

/**
 * Entrypoint class responsible for handling a URI and returning the appropriate response.
 */
class Handler
{
    public readonly string $uri;

    protected array $explodedUri;

    public function __construct(string $uri)
    {
        $this->uri = $uri;

        $this->explodedUri = $this->splitUri($uri);
    }

    /**
     * Completes the full handling process for a URI, returning generated HTML.
     */
    public function render(): string
    {
        $type = $this->getType();

        try {
            switch ($type) {
                case 'article':
                case 'articles':
                    return $this->renderArticle();
                case 'sitemap.xml':
                    header('Content-Type: application/xml');
                    return SitemapRenderer::render();
                case '/':
                case '':
                    return HomeRenderer::render();
                default:
                    throw new NotFoundException("Unknown route: {$type}");
            }
        } catch (NotFoundException $e) {
            return NotFoundRenderer::render($e->getMessage());
        }

        return "Failed to render. URI: {$this->uri}";
    }

    /**
     * First part of the URI, e.g. 'articles'.
     */
    public function getType(): string
    {
        return strtolower($this->explodedUri[0] ?? '');
    }

    /**
     * @return string Second part of the URI, e.g. 'some-page'.
     */
    public function getSlug(): string
    {
        return $this->explodedUri[1] ?? '';
    }

    /**
     * @throws NotFoundException When no article exists with that URI.
     */
    protected function renderArticle(): string
    {
        $slug = $this->getSlug();
        $article = Article::fromSlug($slug, ArticleList::DATA_PATH);

        if (!$article) {
            throw new NotFoundException("Article not found: {$slug}");
        }

        return Renderer::render($article);
    }

    protected function splitUri(string $uri): array
    {
        // Remove and leading or trailing slashes.
        $uri = trim($uri, '/');

        // Chop it up into parts.
        $parts = explode('/', $uri);

        return $parts;
    }
}
