# Managing Draft Articles

The Hg Ops website supports draft articles that can be worked on without appearing on the live site.

## How It Works

### Draft Directory Structure
```
src/app/
├── blog/                    # Published articles (appear on site)
│   ├── article-1/
│   │   └── page.mdx
│   └── article-2/
│       └── page.mdx
└── blog-drafts/            # Draft articles (hidden from site)
    └── draft-article/
        └── page.mdx
```

### Automatic Exclusion
- Articles in `src/app/blog-drafts/` are automatically excluded from the blog listing
- Draft articles won't appear in production builds
- The `loadArticles()` function ignores the `blog-drafts` directory

## Working with Drafts

### Creating a Draft Article
1. Create a new directory in `src/app/blog-drafts/`
2. Add your `page.mdx` file with the same structure as published articles
3. The article will be accessible in development at `/blog-drafts/your-article-name`

### Publishing a Draft
When ready to publish, simply move the directory:
```bash
mv src/app/blog-drafts/your-article-name src/app/blog/your-article-name
```

### Accessing Drafts in Development
- Draft articles are accessible at `/blog-drafts/article-name` in development
- They won't appear in the main blog listing
- You can link to them directly for review purposes

## Current Draft Articles

- **Mercury Detection Partnership** (`/blog-drafts/mercury-detection-partnership`)
  - Ready for review
  - Can be published by moving to `src/app/blog/`

## Environment Behavior

- **Development**: Draft articles are accessible via direct URL
- **Production**: Draft articles are completely excluded from build
- **Blog Listing**: Only shows articles from `src/app/blog/`

## Best Practices

1. **Use descriptive directory names** for drafts
2. **Keep the same MDX structure** as published articles
3. **Test drafts thoroughly** before publishing
4. **Move (don't copy)** when publishing to avoid duplicates
5. **Use draft URLs** for sharing with reviewers

## Technical Implementation

The exclusion is handled in `src/lib/mdx.ts`:
- `loadArticles()` ignores `**/blog-drafts/**` patterns
- `loadDraftArticles()` function available for development features
- Production builds automatically exclude draft content
